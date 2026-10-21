// A file the assistant attached to its reply — a study PDF. Download saves it under its own name;
// Open shows it in Chrome's PDF viewer. Both are plain links to the file's blob: URL, which lives as
// long as the page.

import { Icon } from '@/components/common/icon';
import type { Attachment } from '@/services/types';

const size = (bytes: number): string => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function AttachmentCard({ file }: { file: Attachment }) {
    return (
        <div class="ca-file">
            <span class="ca-file-icon" aria-hidden="true">
                <Icon name="doc" size={18} />
            </span>
            <div class="ca-file-text">
                <span class="ca-file-name">{file.title}</span>
                <span class="ca-file-meta">
                    PDF · {file.pages} {file.pages === 1 ? 'page' : 'pages'} · {size(file.bytes)}
                </span>
            </div>
            <div class="ca-file-actions">
                <a class="ca-file-btn ca-file-btn--main" href={file.url} download={file.filename} aria-label={`Download ${file.filename}`}>
                    <Icon name="download" size={15} />
                    Download
                </a>
                <a class="ca-file-btn" href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.title} in a new tab`}>
                    Open
                </a>
            </div>
        </div>
    );
}
