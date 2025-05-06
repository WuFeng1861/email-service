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
var EmailQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueueService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_queue_entity_1 = require("./entities/email-queue.entity");
const email_keys_service_1 = require("../email-keys/email-keys.service");
const email_templates_service_1 = require("../email-templates/email-templates.service");
const cache_service_1 = require("../cache/cache.service");
let EmailQueueService = EmailQueueService_1 = class EmailQueueService {
    constructor(emailQueueRepository, emailKeysService, emailTemplatesService, cacheService) {
        this.emailQueueRepository = emailQueueRepository;
        this.emailKeysService = emailKeysService;
        this.emailTemplatesService = emailTemplatesService;
        this.cacheService = cacheService;
        this.logger = new common_1.Logger(EmailQueueService_1.name);
        this.STATS_CACHE_KEY = 'email_queue_stats';
        this.STATS_CACHE_TTL = 300;
        this.refreshStatsCache();
    }
    async queueEmail(sendEmailDto) {
        const emailKeys = await this.emailKeysService.findByApp(sendEmailDto.app);
        if (!emailKeys.length) {
            throw new common_1.NotFoundException(`No email keys found for app: ${sendEmailDto.app}`);
        }
        let selectedEmailKey = null;
        for (const key of emailKeys) {
            if (await this.emailKeysService.canSendEmail(key.id)) {
                selectedEmailKey = key;
                break;
            }
        }
        if (!selectedEmailKey) {
            throw new common_1.BadRequestException(`All email keys for app ${sendEmailDto.app} have reached their daily sending limit`);
        }
        await this.emailTemplatesService.findOne(sendEmailDto.templateId);
        const rendered = await this.emailTemplatesService.renderTemplate(sendEmailDto.templateId, sendEmailDto.templateData);
        const formatRecipients = (recipients) => {
            if (!recipients || !recipients.length)
                return null;
            return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(',');
        };
        const queueEntry = this.emailQueueRepository.create({
            app: sendEmailDto.app,
            recipient: sendEmailDto.recipientName
                ? `${sendEmailDto.recipientName} <${sendEmailDto.recipient}>`
                : sendEmailDto.recipient,
            cc: formatRecipients(sendEmailDto.cc),
            bcc: formatRecipients(sendEmailDto.bcc),
            subject: rendered.subject,
            content: rendered.content,
            contentType: rendered.type,
            templateId: sendEmailDto.templateId,
            templateData: sendEmailDto.templateData,
            emailKeyId: selectedEmailKey.id,
            status: email_queue_entity_1.EmailStatus.PENDING,
        });
        const saved = await this.emailQueueRepository.save(queueEntry);
        await this.refreshStatsCache();
        return saved;
    }
    async findPendingEmails(limit = 10) {
        return this.emailQueueRepository.find({
            where: {
                status: email_queue_entity_1.EmailStatus.PENDING,
            },
            order: {
                createdAt: 'ASC',
            },
            take: limit,
        });
    }
    async markAsProcessed(id, status, sendEmailKeyId, errorMessage) {
        const email = await this.emailQueueRepository.findOne({ where: { id } });
        if (!email) {
            throw new common_1.NotFoundException(`Email queue item with ID ${id} not found`);
        }
        email.status = status;
        if (status === email_queue_entity_1.EmailStatus.SENT) {
            email.sentAt = new Date();
            await this.emailKeysService.incrementSentCount(sendEmailKeyId);
            email.emailKeyId = sendEmailKeyId;
        }
        else if (status === email_queue_entity_1.EmailStatus.FAILED) {
            email.errorMessage = errorMessage;
            email.retryCount += 1;
        }
        const updated = await this.emailQueueRepository.save(email);
        await this.refreshStatsCache();
        return updated;
    }
    async getQueueStats() {
        return this.cacheService.getOrSet(this.STATS_CACHE_KEY, async () => {
            const total = await this.emailQueueRepository.count();
            const pending = await this.emailQueueRepository.count({ where: { status: email_queue_entity_1.EmailStatus.PENDING } });
            const sent = await this.emailQueueRepository.count({ where: { status: email_queue_entity_1.EmailStatus.SENT } });
            const failed = await this.emailQueueRepository.count({ where: { status: email_queue_entity_1.EmailStatus.FAILED } });
            return { total, pending, sent, failed };
        }, this.STATS_CACHE_TTL);
    }
    async getAppStatsByDateRange(app, startDate, endDate) {
        const sent = await this.emailQueueRepository.count({
            where: {
                app,
                status: email_queue_entity_1.EmailStatus.SENT,
                createdAt: (0, typeorm_2.Between)(startDate, endDate),
            },
        });
        const failed = await this.emailQueueRepository.count({
            where: {
                app,
                status: email_queue_entity_1.EmailStatus.FAILED,
                createdAt: (0, typeorm_2.Between)(startDate, endDate),
            },
        });
        const pending = await this.emailQueueRepository.count({
            where: {
                app,
                status: email_queue_entity_1.EmailStatus.PENDING,
                createdAt: (0, typeorm_2.Between)(startDate, endDate),
            },
        });
        return { sent, failed, pending };
    }
    async refreshStatsCache() {
        const total = await this.emailQueueRepository.count();
        const pending = await this.emailQueueRepository.count({ where: { status: email_queue_entity_1.EmailStatus.PENDING } });
        const sent = await this.emailQueueRepository.count({ where: { status: email_queue_entity_1.EmailStatus.SENT } });
        const failed = await this.emailQueueRepository.count({ where: { status: email_queue_entity_1.EmailStatus.FAILED } });
        this.cacheService.set(this.STATS_CACHE_KEY, { total, pending, sent, failed }, this.STATS_CACHE_TTL);
        this.logger.log('Email queue stats cache refreshed');
    }
};
exports.EmailQueueService = EmailQueueService;
exports.EmailQueueService = EmailQueueService = EmailQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_queue_entity_1.EmailQueue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        email_keys_service_1.EmailKeysService,
        email_templates_service_1.EmailTemplatesService,
        cache_service_1.CacheService])
], EmailQueueService);
//# sourceMappingURL=email-queue.service.js.map