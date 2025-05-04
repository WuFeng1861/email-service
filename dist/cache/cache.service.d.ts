export declare class CacheService {
    private cache;
    private readonly logger;
    set<T>(key: string, value: T, ttlSeconds?: number | null): void;
    get<T>(key: string): T | null;
    delete(key: string): void;
    clear(): void;
    keys(): string[];
    getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number | null): Promise<T>;
}
