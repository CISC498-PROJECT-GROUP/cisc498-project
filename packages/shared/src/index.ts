/* @canvas-assistant/shared — the one declaration of a type both the API and the extension speak.
   No build step: `main`/`types` point straight at this TypeScript, which Bun runs and bundles as
   project source. A type belongs here only when both sides use it; a view-model the extension never
   sends or receives stays in extension/src/services/types, and a shape only the API handles stays
   in its service folder. */

export type { Envelope, HealthStatus } from './types/api';
export type { ChatMessageParam, ChatTurnRequest, ChatTurnResponse, ContentBlock } from './types/chat';
export type {
    CheatSheet,
    CourseRef,
    DigestRequest,
    ExamInfo,
    LectureDigest,
    LectureQuote,
    LectureRef,
    LinksRequest,
    LinksResponse,
    Overview,
    PlanRequest,
    PlanSection,
    PlanUnit,
    QuoteKind,
    RenderResponse,
    SaidQuote,
    SectionRequest,
    StudyDocument,
    StudyKind,
    StudyLink,
    StudyPlan,
} from './types/study';
export type { CalloutBlock, CardsBlock, ColumnsBlock, DiagramBlock, FormulaBlock, LeafBlock, ListBlock, SaidBlock, StudyBlock, StudySection, TableBlock, TableData, TextBlock, WalkthroughBlock } from './types/study-blocks';

/* The Canvas tools. Declared once: the backend sends these definitions to the model, the extension
   implements one executor per name, and the type below makes a missing executor a compile error. */
export { CANVAS_TOOLS, type CanvasToolName } from './tools/canvas-tools';
