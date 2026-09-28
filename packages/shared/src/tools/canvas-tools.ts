// The tools the model may call. Each one is executed by the extension against the Canvas REST API,
// with the student's own session — so a tool can only ever see what the student can see.
// Descriptions are written for the model: say what the tool returns and when to reach for it.

import { COURSE_TOOLS } from './course-tools';
import { CONTENT_TOOLS } from './content-tools';

export interface ToolDefinition {
    name: string;
    description: string;
    input_schema: { type: 'object'; properties: Record<string, unknown>; required?: readonly string[]; additionalProperties?: boolean };
}

export const CANVAS_TOOLS = [...COURSE_TOOLS, ...CONTENT_TOOLS] as const satisfies readonly ToolDefinition[];

export type CanvasToolName = (typeof CANVAS_TOOLS)[number]['name'];
