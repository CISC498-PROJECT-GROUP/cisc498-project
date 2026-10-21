/* The study guide's stylesheets are imported as text (`with { type: 'text' }`) and inlined into the
   printed page — see services/study/render/document.ts. */
declare module '*.css' {
    const text: string;
    export default text;
}
