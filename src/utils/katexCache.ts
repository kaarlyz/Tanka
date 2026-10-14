import katex from "katex";

// ponytail: in-memory LRU map capped at 8000 entries. Upgrade to Web Worker if heavy background parsing needed.
const katexCache = new Map<string, string>();
const originalRenderToString = katex.renderToString;

if (!(katex as any).__cached) {
  (katex as any).__cached = true;
  katex.renderToString = function (tex: string, options?: any): string {
    const key = `${options?.displayMode ? "D:" : "I:"}${tex}`;
    const cached = katexCache.get(key);
    if (cached !== undefined) {
      katexCache.delete(key);
      katexCache.set(key, cached);
      return cached;
    }

    const rendered = originalRenderToString.call(katex, tex, options);
    if (katexCache.size >= 8000) {
      const oldestKey = katexCache.keys().next().value;
      if (oldestKey !== undefined) {
        katexCache.delete(oldestKey);
      }
    }
    katexCache.set(key, rendered);
    return rendered;
  };
}

if (typeof window !== "undefined") {
  (window as any).katexCache = katexCache;
}

export { katexCache };
