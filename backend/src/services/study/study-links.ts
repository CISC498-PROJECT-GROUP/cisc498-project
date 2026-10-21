// POST /study/links: explainer videos for each section of one unit — the guide's "WATCH" chips.
// The model searches YouTube with the web_search server tool and hands its picks in through the
// strict submit_links tool. A link survives only if its URL came back from a search in this very
// call, or (for a gold "posted" chip) is one the course itself links to: a model never gets to
// type a URL a student will click.
//
// Videos are a garnish. Any failure — web search disabled for the key's organisation, a refusal, a
// timeout — is logged and answered with no links, never an error that loses the student a guide.

import type { LinksRequest, LinksResponse, StudyLink } from '@canvas-assistant/shared';
import { Anthropic, anthropic } from '@/services/common/svc-anthropic';
import { app_env } from '@/services/common/svc-env';
import { createLogger } from '@/services/common/svc-log';
import { ModelNotConfiguredError } from '@/services/common/svc-model';
import { arr, bool, obj, str } from '@/services/study/schema';
import { requireModel } from '@/services/study/study-model';

const log = createLogger('study');

/** A search can pause mid-turn (pause_turn); resume it at most this many times. */
const MAX_ROUNDS = 4;

const LINKS_SYSTEM = `You pick short explainer videos on YouTube for the sections of one unit of a university study guide. For each section, search YouTube and choose at most two videos that clearly teach that section's topic at the right level — prefer well-known educational channels and videos under 20 minutes. When the course's own posted videos (listed in the request) fit a section, include them too, marked posted. Use only URLs that appeared in your search results or in the posted list — never write a URL from memory. Title each link with the video's title, adding " (<channel>)" when the search result names the channel, under 60 characters in all. A section with nothing good gets no links. Finish by calling submit_links once with every section.`;

const SUBMIT: Anthropic.Beta.BetaTool = {
    name: 'submit_links',
    description: 'Hand in the chosen videos for every section, once, when done searching.',
    strict: true,
    input_schema: obj({ sections: arr(obj({ number: str, links: arr(obj({ title: str, url: str, posted: bool })) })) }) as Anthropic.Beta.BetaTool.InputSchema,
};

/** A YouTube video's canonical URL, or null when the URL is not a video. */
export function youtubeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^(www|m)\./, '');
        const id = host === 'youtu.be' ? parsed.pathname.slice(1) : host === 'youtube.com' && parsed.pathname === '/watch' ? parsed.searchParams.get('v') : null;
        return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
    } catch {
        return null;
    }
}

/** Every URL inside the server tools' results — search hits, filtered or not. The model's own text
    and tool calls are skipped: a URL there is one it wrote, not one it found. */
export function foundUrls(content: unknown[]): Set<string> {
    const found = new Set<string>();
    const walk = (value: unknown): void => {
        if (typeof value === 'string') for (const match of value.match(/https?:\/\/[^\s"'<>)\]]+/g) ?? []) found.add(youtubeUrl(match) ?? match);
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    for (const block of content as { type?: string }[]) if (!['text', 'tool_use', 'thinking', 'redacted_thinking'].includes(block.type ?? '')) walk(block);
    return found;
}

export function verifyLinks(picked: LinksResponse, found: Set<string>, posted: Set<string>): LinksResponse {
    const check = (link: StudyLink): StudyLink | null => {
        if (link.posted) return posted.has(link.url.trim()) ? { ...link, url: link.url.trim() } : null;
        const url = youtubeUrl(link.url);
        return url && found.has(url) ? { ...link, url } : null;
    };
    return {
        sections: picked.sections.map((section) => ({
            number: section.number,
            links: section.links
                .map(check)
                .filter((link): link is StudyLink => link !== null)
                .slice(0, 3),
        })),
    };
}

export async function findLinks(request: LinksRequest, signal?: AbortSignal): Promise<LinksResponse> {
    requireModel();
    const { course, unit, resources } = request;
    const sections = unit.sections.map((s) => `${s.number} ${s.title} — ${s.points.join('; ')}`).join('\n');
    const postedList = resources.length > 0 ? resources.map((r) => `- ${r.title}: ${r.url}`).join('\n') : '(none)';
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: `Course: ${course.code} — ${course.name}\nUnit ${unit.number}: ${unit.title}\n\nSections:\n${sections}\n\nThe course's posted videos:\n${postedList}` }];
    const found = new Set<string>();

    try {
        for (let round = 0; round < MAX_ROUNDS; round++) {
            const response = await anthropic().beta.messages.create(
                {
                    model: app_env.study_model,
                    max_tokens: 8000,
                    betas: ['server-side-fallback-2026-07-01'],
                    fallbacks: 'default',
                    thinking: { type: 'adaptive' },
                    output_config: { effort: 'low' },
                    system: LINKS_SYSTEM,
                    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8, allowed_domains: ['youtube.com'] }, SUBMIT],
                    messages,
                },
                { signal },
            );
            foundUrls(response.content).forEach((url) => found.add(url));
            const submit = response.content.find((block): block is Anthropic.Beta.BetaToolUseBlock => block.type === 'tool_use' && block.name === 'submit_links');
            if (submit) {
                const verified = verifyLinks(submit.input as LinksResponse, found, new Set(resources.map((r) => r.url.trim())));
                log.info('links complete', { unit: unit.number, rounds: round + 1, found: found.size, kept: verified.sections.reduce((n, s) => n + s.links.length, 0) });
                return verified;
            }
            if (response.stop_reason !== 'pause_turn') break;
            messages.push({ role: 'assistant', content: response.content });
        }
        log.warn('links not submitted', { unit: unit.number });
    } catch (error) {
        if (error instanceof ModelNotConfiguredError) throw error;
        log.warn('links failed', { unit: unit.number, error: error instanceof Anthropic.APIError ? (error.status ?? 'network') : 'exception' });
    }
    return { sections: [] };
}
