// Renders an assistant answer from the token tree in services/format/markdown.ts. Links open in a
// new tab so the student keeps their place on the dashboard.

import { Fragment } from 'preact';
import { parseMarkdown, type Inline } from '@/services/format/markdown';

function InlineRun({ tokens }: { tokens: Inline[] }) {
    return (
        <>
            {tokens.map((t, i) => {
                if (t.kind === 'bold') return <strong key={i}>{t.text}</strong>;
                if (t.kind === 'italic') return <em key={i}>{t.text}</em>;
                if (t.kind === 'code') return <code key={i}>{t.text}</code>;
                if (t.kind === 'link')
                    return (
                        <a key={i} href={t.href} target="_blank" rel="noopener noreferrer">
                            {t.text}
                        </a>
                    );
                return <Fragment key={i}>{t.text}</Fragment>;
            })}
        </>
    );
}

export function Markdown({ text }: { text: string }) {
    return (
        <div class="ca-md">
            {parseMarkdown(text, location.origin).map((block, i) => {
                if (block.kind === 'p')
                    return (
                        <p key={i}>
                            {block.lines.map((line, j) => (
                                <Fragment key={j}>
                                    {j > 0 && <br />}
                                    <InlineRun tokens={line} />
                                </Fragment>
                            ))}
                        </p>
                    );
                const List = block.kind;
                return (
                    <List key={i}>
                        {block.items.map((item, j) => (
                            <li key={j}>
                                <InlineRun tokens={item} />
                            </li>
                        ))}
                    </List>
                );
            })}
        </div>
    );
}
