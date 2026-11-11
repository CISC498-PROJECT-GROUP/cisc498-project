// The submission form: a toggle between the ways this assignment takes work (text, link, file), the
// matching input, and a two-step send. Submitting writes to Canvas as the student and starts an
// attempt, so the first press only checks the input and asks; the second sends.

import { useState } from 'preact/hooks';
import { Icon } from '@/components/common/icon';
import { Segmented } from '@/components/common/segmented';
import type { SubmitState } from '@/services/hooks/use-submit';
import type { SubmissionInput, SubmitKind, SubmitTarget } from '@/services/types';

const LABELS: Record<SubmitKind, string> = { online_text_entry: 'Text', online_url: 'Link', online_upload: 'File' };

const size = (bytes: number): string => (bytes < 1e6 ? `${Math.max(1, Math.round(bytes / 1e3))} KB` : `${(bytes / 1e6).toFixed(1)} MB`);

interface SubmitFormProps {
    target: SubmitTarget;
    sender: SubmitState;
    courseCode: string;
}

export function SubmitForm({ target, sender, courseCode }: SubmitFormProps) {
    const [kind, setKind] = useState<SubmitKind>(target.kinds[0]!);
    const [text, setText] = useState('');
    const [url, setUrl] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [confirming, setConfirming] = useState(false);

    const input = (): SubmissionInput => (kind === 'online_text_entry' ? { kind, text } : kind === 'online_url' ? { kind, url } : { kind, files });
    /** Any edit takes back a pending confirmation and a stale error. */
    const edited = () => {
        setConfirming(false);
        sender.clearError();
    };
    const editing =
        <T,>(set: (value: T) => void) =>
        (value: T) => {
            set(value);
            edited();
        };

    return (
        <form
            class="ca-submit-form"
            noValidate
            onSubmit={(e) => {
                e.preventDefault();
                if (confirming) sender.submit(input());
                else setConfirming(sender.review(input()));
            }}>
            {target.kinds.length > 1 && <Segmented label="Submit as" value={kind} options={target.kinds.map((k) => ({ value: k, label: LABELS[k] }))} onChange={editing(setKind)} />}

            {kind === 'online_text_entry' && (
                <label class="ca-field-label">
                    Your submission
                    <textarea class="ca-field ca-field--area" rows={8} value={text} disabled={sender.sending} onInput={(e) => editing(setText)(e.currentTarget.value)} />
                </label>
            )}
            {kind === 'online_url' && (
                <label class="ca-field-label">
                    Link to your work
                    <input class="ca-field" type="url" placeholder="https://" value={url} disabled={sender.sending} onInput={(e) => editing(setUrl)(e.currentTarget.value)} />
                </label>
            )}
            {kind === 'online_upload' && (
                <label class="ca-field-label">
                    {target.extensions.length > 0 ? `Files (${target.extensions.map((x) => `.${x}`).join(', ')})` : 'Files'}
                    <input
                        class="ca-field ca-field--file"
                        type="file"
                        multiple
                        accept={target.extensions.length > 0 ? target.extensions.map((x) => `.${x}`).join(',') : undefined}
                        disabled={sender.sending}
                        onChange={(e) => editing(setFiles)(Array.from(e.currentTarget.files ?? []))}
                    />
                </label>
            )}
            {kind === 'online_upload' && files.length > 0 && (
                <ul class="ca-file-list">
                    {files.map((f) => (
                        <li key={f.name}>
                            {f.name} <span class="ca-row-meta">{size(f.size)}</span>
                        </li>
                    ))}
                </ul>
            )}

            {sender.error && (
                <p class="ca-submit-error" role="alert">
                    <Icon name="alert" size={16} />
                    {sender.error}
                </p>
            )}

            {confirming ? (
                <div class="ca-confirm" role="group" aria-label="Confirm submission">
                    <p class="ca-confirm-text">
                        Submit this to {courseCode} as you? Canvas records it right away{target.submittedAt ? ' as a new attempt' : ''}.
                    </p>
                    <div class="ca-confirm-actions">
                        <button type="button" class="ca-btn ca-btn--quiet" onClick={() => setConfirming(false)} disabled={sender.sending}>
                            Cancel
                        </button>
                        <button type="submit" class="ca-btn ca-btn--primary" disabled={sender.sending}>
                            {sender.sending ? 'Submitting…' : 'Yes, submit'}
                        </button>
                    </div>
                </div>
            ) : (
                <button type="submit" class="ca-btn ca-btn--primary ca-btn--wide">
                    <Icon name="upload" size={16} />
                    Submit assignment
                </button>
            )}
        </form>
    );
}
