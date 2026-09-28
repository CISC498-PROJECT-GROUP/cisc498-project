/* Stylesheets are imported as text (`with { type: 'text' }`) and injected into the widget's shadow
   root — see src/styles/index.ts. */
declare module '*.css' {
    const text: string;
    export default text;
}

/** The backend's base URL, substituted by scripts/build.ts. Read it through services/config.ts. */
declare const __API_BASE__: string;
