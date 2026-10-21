// Failures the chat service raises, each mapped to one status by the route. The model-call failures
// are the ones every model feature shares (svc-model.ts), under the names the chat code uses.

export { ModelNotConfiguredError as ChatNotConfiguredError, ModelUpstreamError as ChatUpstreamError } from '@/services/common/svc-model';

/** The request itself is malformed — 435. */
export class ChatRequestError extends Error {}
