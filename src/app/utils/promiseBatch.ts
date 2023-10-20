export async function promiseBatch<T, R>(items: T[], fn: (item: T) => Promise<R>, batchSize: number): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        results.push(...await Promise.all(items.slice(i, i + batchSize).map(fn)));
    }
    return results;
  }