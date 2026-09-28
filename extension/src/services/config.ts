// Build-time configuration. The one place __API_BASE__ is read.

export const API_BASE: string = __API_BASE__;

/** True inside the real extension; false in the preview harness, where there is no chrome.runtime. */
export const inExtension = (): boolean => typeof chrome !== 'undefined' && typeof chrome.runtime?.id === 'string';
