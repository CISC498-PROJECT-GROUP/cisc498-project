import { zipSync, strToU8 } from 'fflate';
import { describe, expect, it } from 'bun:test';
import { parseDocx } from '@/services/tools/docx';

const documentXml = (body: string) => `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;

const asBinary = (bytes: Uint8Array): string => String.fromCharCode(...bytes);

describe('parseDocx', () => {
    it('extracts text across runs and paragraphs', () => {
        const bytes = zipSync({ 'word/document.xml': strToU8(documentXml('<w:p><w:r><w:t>Google </w:t></w:r><w:r><w:t>Docs</w:t></w:r></w:p><w:p><w:r><w:t>Second paragraph</w:t></w:r></w:p>')) });

        expect(parseDocx(asBinary(bytes))).toBe('Google Docs\nSecond paragraph');
    });
});