interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    for (const [bucketKey, bucket] of buckets) {
      if (
        bucket.hits.length === 0 ||
        now - bucket.hits[bucket.hits.length - 1] > windowMs
      ) {
        buckets.delete(bucketKey);
      }
    }
    lastSweep = now;
  }

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return true;
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return false;
}

export function resetRateLimits(): void {
  buckets.clear();
}
