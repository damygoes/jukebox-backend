interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export class TTLCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    constructor(private ttlMs: number) {}

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }

    set(key: string, value: T) {
        this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }
}