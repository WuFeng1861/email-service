"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
let CacheService = CacheService_1 = class CacheService {
    constructor() {
        this.cache = new Map();
        this.logger = new common_1.Logger(CacheService_1.name);
    }
    set(key, value, ttlSeconds = null) {
        const expiry = ttlSeconds !== null ? Date.now() + ttlSeconds * 1000 : null;
        this.cache.set(key, { value, expiry });
        this.logger.debug(`Cached item with key: ${key}`);
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        if (item.expiry !== null && item.expiry < Date.now()) {
            this.delete(key);
            return null;
        }
        return item.value;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    keys() {
        return Array.from(this.cache.keys());
    }
    async getOrSet(key, factory, ttlSeconds = null) {
        const existingValue = this.get(key);
        if (existingValue !== null) {
            return existingValue;
        }
        const newValue = await factory();
        this.set(key, newValue, ttlSeconds);
        return newValue;
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)()
], CacheService);
//# sourceMappingURL=cache.service.js.map