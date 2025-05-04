import { Injectable, Logger } from '@nestjs/common';

interface CacheItem<T> {
  value: T;
  expiry: number | null; // null means no expiration
}

@Injectable()
export class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly logger = new Logger(CacheService.name);

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttlSeconds Time to live in seconds (null for no expiration)
   */
  set<T>(key: string, value: T, ttlSeconds: number | null = null): void {
    const expiry = ttlSeconds !== null ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiry });
    this.logger.debug(`Cached item with key: ${key}`);
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if the item has expired
    if (item.expiry !== null && item.expiry < Date.now()) {
      this.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all keys in the cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get or set cache value
   * @param key Cache key
   * @param factory Function to create value if not in cache
   * @param ttlSeconds Time to live in seconds (null for no expiration)
   * @returns The cached or newly created value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number | null = null,
  ): Promise<T> {
    const existingValue = this.get<T>(key);
    if (existingValue !== null) {
      return existingValue;
    }

    const newValue = await factory();
    this.set(key, newValue, ttlSeconds);
    return newValue;
  }
}