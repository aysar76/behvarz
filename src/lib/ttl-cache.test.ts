import { describe, expect, it, vi } from "vitest";
import { TtlCache } from "@/lib/ttl-cache";

describe("TtlCache", () => {
  it("stores and returns a value", () => {
    const cache = new TtlCache<string>({ ttlMs: 1000 });
    cache.set("a", "1");
    expect(cache.get("a")).toBe("1");
  });

  it("returns undefined for a missing key", () => {
    const cache = new TtlCache<string>({ ttlMs: 1000 });
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after ttl", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>({ ttlMs: 1000 });
    cache.set("a", "1");
    vi.advanceTimersByTime(1001);
    expect(cache.get("a")).toBeUndefined();
    vi.useRealTimers();
  });

  it("evicts the oldest entry when at capacity", () => {
    const cache = new TtlCache<string>({ ttlMs: 60_000, maxSize: 2 });
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });

  it("clears all entries", () => {
    const cache = new TtlCache<string>({ ttlMs: 60_000 });
    cache.set("a", "1");
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
  });
});
