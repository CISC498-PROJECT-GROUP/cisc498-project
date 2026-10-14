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

    it('normalizes tabs, line breaks and surrounding whitespace', () => {
        const bytes = zipSync({
            'word/document.xml': strToU8(
                documentXml('<w:p><w:r><w:t>  Before </w:t><w:tab/><w:t> after </w:t><w:br/><w:t> next </w:t></w:r></w:p>'),
            ),
        });

        expect(parseDocx(asBinary(bytes))).toBe('Before after next');
    });

    it('ignores empty paragraphs', () => {
        const bytes = zipSync({ 'word/document.xml': strToU8(documentXml('<w:p/><w:p><w:r><w:t>Visible</w:t></w:r></w:p><w:p><w:r/></w:p>')) });

        expect(parseDocx(asBinary(bytes))).toBe('Visible');
    });

    it('rejects archives without the Word document entry', () => {
        const bytes = zipSync({ 'word/styles.xml': strToU8('<w:styles/>') });

        expect(() => parseDocx(asBinary(bytes))).toThrow('DOCX is missing word/document.xml');
    });

    it('rejects invalid document XML', () => {
        const bytes = zipSync({ 'word/document.xml': strToU8('<w:document><w:body>') });

        expect(() => parseDocx(asBinary(bytes))).toThrow('DOCX contains invalid document XML');
    });
});