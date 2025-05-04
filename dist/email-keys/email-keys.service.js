"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailKeysService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailKeysService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_key_entity_1 = require("./entities/email-key.entity");
const cache_service_1 = require("../cache/cache.service");
let EmailKeysService = EmailKeysService_1 = class EmailKeysService {
    constructor(emailKeyRepository, cacheService) {
        this.emailKeyRepository = emailKeyRepository;
        this.cacheService = cacheService;
        this.logger = new common_1.Logger(EmailKeysService_1.name);
        this.CACHE_KEY = 'email_keys';
        this.CACHE_TTL = 3600;
        this.refreshCache();
    }
    async create(createEmailKeyDto) {
        const emailKey = this.emailKeyRepository.create(createEmailKeyDto);
        const saved = await this.emailKeyRepository.save(emailKey);
        await this.refreshCache();
        return saved;
    }
    async findAll() {
        return this.cacheService.getOrSet(this.CACHE_KEY, async () => {
            this.logger.log('Cache miss for email keys, fetching from database');
            return this.emailKeyRepository.find();
        }, this.CACHE_TTL);
    }
    async findOne(id) {
        const emailKeys = await this.findAll();
        const emailKey = emailKeys.find(key => key.id === id);
        if (!emailKey) {
            throw new common_1.NotFoundException(`Email key with ID ${id} not found`);
        }
        return emailKey;
    }
    async findByApp(app) {
        const emailKeys = await this.findAll();
        return emailKeys.filter(key => key.app === app);
    }
    async update(id, updateEmailKeyDto) {
        const emailKey = await this.findOne(id);
        Object.assign(emailKey, updateEmailKeyDto);
        const updated = await this.emailKeyRepository.save(emailKey);
        await this.refreshCache();
        return updated;
    }
    async remove(id) {
        const emailKey = await this.findOne(id);
        await this.emailKeyRepository.remove(emailKey);
        await this.refreshCache();
    }
    async refreshCache() {
        const emailKeys = await this.emailKeyRepository.find();
        this.cacheService.set(this.CACHE_KEY, emailKeys, this.CACHE_TTL);
        this.logger.log('Email keys cache refreshed');
    }
    async incrementSentCount(id) {
        const emailKey = await this.findOne(id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastReset = new Date(emailKey.lastResetDate);
        lastReset.setHours(0, 0, 0, 0);
        if (today.getTime() > lastReset.getTime()) {
            emailKey.sentCount = 1;
            emailKey.lastResetDate = today;
        }
        else {
            emailKey.sentCount += 1;
        }
        const updated = await this.emailKeyRepository.save(emailKey);
        await this.refreshCache();
        return updated;
    }
    async canSendEmail(id) {
        const emailKey = await this.findOne(id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastReset = new Date(emailKey.lastResetDate);
        lastReset.setHours(0, 0, 0, 0);
        if (today.getTime() > lastReset.getTime()) {
            return true;
        }
        return emailKey.sentCount < emailKey.limitCount;
    }
};
exports.EmailKeysService = EmailKeysService;
exports.EmailKeysService = EmailKeysService = EmailKeysService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_key_entity_1.EmailKey)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cache_service_1.CacheService])
], EmailKeysService);
//# sourceMappingURL=email-keys.service.js.map