// Runs async work over a list with a cap on how much is in flight — the study pipeline sends a dozen
// lectures or sections to the backend, and all at once would trip the model's rate limits.

/** `work` over `items`, at most `limit` at a time; results keep the items' order. The first failure
    rejects the whole run. */
export async function mapLimit<T, R>(items: readonly T[], limit: number, work: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const lane = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await work(items[index]!, index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, lane));
    return results;
}
