// Shorthand for the JSON schemas the study steps hand to structured outputs. Structured outputs want
// every object closed (additionalProperties: false) with every property required, so `obj` does
// both — a field with nothing to say is '' or [] rather than absent.

export type Schema = Record<string, unknown>;

export const str: Schema = { type: 'string' };

export const bool: Schema = { type: 'boolean' };

export const int: Schema = { type: 'integer' };

export const arr = (items: Schema): Schema => ({ type: 'array', items });

export const strs: Schema = arr(str);

export const obj = (properties: Record<string, Schema>): Schema => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });

export const oneOf = (...options: Schema[]): Schema => ({ anyOf: options });

export const nullable = (schema: Schema): Schema => ({ anyOf: [schema, { type: 'null' }] });

export const literal = (value: string): Schema => ({ type: 'string', enum: [value] });
