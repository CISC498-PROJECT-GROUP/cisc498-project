/** The response envelope every backend route answers with. `data` is null on every non-200. */
export interface Envelope<T> {
    data: T | null;
    statusCode: number;
    message: string;
}

/** GET /health. `configured` is false when the API is up but has no model key. */
export interface HealthStatus {
    ok: boolean;
    configured: boolean;
    model: string;
}
