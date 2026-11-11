/* Stylesheets are imported as text (`with { type: 'text' }`) and joined into one <style> at start-up
   — see src/styles/index.ts. */
declare module '*.css' {
    const text: string;
    export default text;
}
