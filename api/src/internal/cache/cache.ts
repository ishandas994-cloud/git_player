interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<T> {
  private data: Map<string, CacheEntry<T>>;
  private ttl: number;

  constructor(ttlMs: number) {
    this.data = new Map();
    this.ttl = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.data.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.data.set(key, { value, expiresAt: Date.now() + this.ttl });
  }
}

export const Shared = new TTLCache<any>(5 * 60 * 1000);

export function playerKey(username: string): string {
  return "player:" + username.toLowerCase();
}