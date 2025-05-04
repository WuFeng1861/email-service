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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsService = void 0;
const common_1 = require("@nestjs/common");
const email_queue_service_1 = require("../email-queue/email-queue.service");
const email_keys_service_1 = require("../email-keys/email-keys.service");
const email_templates_service_1 = require("../email-templates/email-templates.service");
let StatisticsService = class StatisticsService {
    constructor(emailQueueService, emailKeysService, emailTemplatesService) {
        this.emailQueueService = emailQueueService;
        this.emailKeysService = emailKeysService;
        this.emailTemplatesService = emailTemplatesService;
    }
    async getSystemStats() {
        const queueStats = await this.emailQueueService.getQueueStats();
        const emailKeys = await this.emailKeysService.findAll();
        const emailKeysCount = emailKeys.length;
        const templates = await this.emailTemplatesService.findAll();
        const templatesCount = templates.length;
        const appStats = emailKeys.reduce((acc, curr) => {
            if (!acc[curr.app]) {
                acc[curr.app] = {
                    count: 0,
                    totalDailyLimit: 0,
                };
            }
            acc[curr.app].count += 1;
            acc[curr.app].totalDailyLimit += curr.limitCount;
            return acc;
        }, {});
        return {
            emailQueue: queueStats,
            emailKeys: {
                total: emailKeysCount,
                byApp: appStats,
            },
            templates: {
                total: templatesCount,
            },
        };
    }
};
exports.StatisticsService = StatisticsService;
exports.StatisticsService = StatisticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_queue_service_1.EmailQueueService,
        email_keys_service_1.EmailKeysService,
        email_templates_service_1.EmailTemplatesService])
], StatisticsService);
//# sourceMappingURL=statistics.service.js.map