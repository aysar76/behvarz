interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface TtlCacheOptions {
  ttlMs: number;
  maxSize?: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(options: TtlCacheOptions) {
    this.ttlMs = options.ttlMs;
    this.maxSize = options.maxSize ?? 1000;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
