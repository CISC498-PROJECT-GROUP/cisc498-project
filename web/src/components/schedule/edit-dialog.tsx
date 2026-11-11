// Changing credits or grading on a registered section: the choices are the ones WebReg offers for
// that section (lookupCourseInfo). Continuing opens the same review-and-confirm as every other write.

import { useState } from 'preact/hooks';
import { LoadState } from '@/components/common/load-state';
import { Modal } from '@/components/schedule/modal';
import { useSectionInfo } from '@/services/hooks/use-webreg-search';
import type { RegisteredSection, WriteStep } from '@/services/types/webreg';

interface EditDialogProps {
    strm: string;
    section: RegisteredSection;
    onClose: () => void;
    onReview: (step: WriteStep) => void;
}

export function EditDialog({ strm, section, onClose, onReview }: EditDialogProps) {
    const info = useSectionInfo(strm, section.id);
    const [credits, setCredits] = useState(section.credits);
    const [grade, setGrade] = useState(section.gradeOption);
    const options = info.data;
    const creditChoices = options?.creditOptions.length ? options.creditOptions : [section.credits];
    const gradeChoices = options?.gradeOptions.length ? options.gradeOptions : [{ value: section.gradeOption, label: section.gradeLabel }];
    const changed = credits !== section.credits || grade !== section.gradeOption;
    const value = (e: Event) => (e.target as HTMLSelectElement).value;

    return (
        <Modal title={`Change ${section.code}`} onClose={onClose}>
            <p class="ca-modal-lead">
                {section.title} — now {section.credits} credits, {section.gradeLabel.toLowerCase()}.
            </p>
            {!options ? (
                <LoadState state={info} rows={2} />
            ) : (
                <div class="ca-edit-fields">
                    <label class="ca-field-label">
                        Credits
                        <select class="ca-field" value={String(credits)} disabled={creditChoices.length < 2} onChange={(e) => setCredits(Number(value(e)))}>
                            {creditChoices.map((c) => (
                                <option key={c} value={String(c)}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label class="ca-field-label">
                        Grading
                        <select class="ca-field" value={grade} onChange={(e) => setGrade(value(e))}>
                            {gradeChoices.map((g) => (
                                <option key={g.value} value={g.value}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
            <div class="ca-modal-actions">
                <button type="button" class="ca-btn ca-btn--quiet" onClick={onClose}>
                    Cancel
                </button>
                <button type="button" class="ca-btn ca-btn--primary" disabled={!changed || !options} onClick={() => onReview({ kind: 'edit', section: { id: section.id, code: section.code, credits, gradeOption: grade } })}>
                    Review change
                </button>
            </div>
        </Modal>
    );
}
