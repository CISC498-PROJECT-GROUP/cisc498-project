import { DOMParser } from '@xmldom/xmldom';
import { strFromU8, unzipSync } from 'fflate';

const WORD_DOCUMENT = 'word/document.xml';

export function parseDocx(bytes: string): string {
    const files = unzipSync(Uint8Array.from(bytes, (character) => character.charCodeAt(0)));
    const document = files[WORD_DOCUMENT];
    if (!document) throw new Error('DOCX is missing word/document.xml');

    const xml = new DOMParser().parseFromString(strFromU8(document), 'application/xml');
    if (xml.getElementsByTagName('parsererror').length > 0) throw new Error('DOCX contains invalid document XML');

    return Array.from(xml.getElementsByTagNameNS('*', 'p'))
        .map((paragraph) => readParagraph(paragraph))
        .filter((paragraph) => paragraph.length > 0)
        .join('\n');
}

function readParagraph(paragraph: Element): string {
    let text = '';
    const visit = (node: Node): void => {
        if (node.nodeType === 1) {
            const element = node as Element;
            if (element.localName === 't') text += element.textContent ?? '';
            else if (element.localName === 'tab') text += '\t';
            else if (element.localName === 'br') text += '\n';
            else for (const child of Array.from(element.childNodes)) visit(child);
        }
    };
    visit(paragraph);
    return text
        .replace(/\s+/g, ' ')
        .trim();
}