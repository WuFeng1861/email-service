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
var EmailSenderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSenderService = void 0;
const common_1 = require("@nestjs/common");
const email_queue_service_1 = require("./email-queue.service");
const email_keys_service_1 = require("../email-keys/email-keys.service");
const email_queue_entity_1 = require("./entities/email-queue.entity");
const nodemailer = require("nodemailer");
const cache_service_1 = require("../cache/cache.service");
let EmailSenderService = EmailSenderService_1 = class EmailSenderService {
    constructor(emailQueueService, emailKeysService, cacheService) {
        this.emailQueueService = emailQueueService;
        this.emailKeysService = emailKeysService;
        this.cacheService = cacheService;
        this.logger = new common_1.Logger(EmailSenderService_1.name);
        this.transporters = new Map();
        this.isProcessing = false;
        this.PROCESSING_INTERVAL_MS = 5000;
    }
    onModuleInit() {
        this.initializeTransporters();
        this.startProcessingQueue();
    }
    async initializeTransporters() {
        const emailKeys = await this.emailKeysService.findAll();
        for (const key of emailKeys) {
            this.createTransporter(key);
        }
        this.logger.log(`Initialized ${this.transporters.size} email transporters`);
    }
    createTransporter(emailKey) {
        try {
            let host, port;
            switch (emailKey.emailCompany.toLowerCase()) {
                case 'qq':
                    host = 'smtp.qq.com';
                    port = 587;
                    break;
                case '163':
                    host = 'smtp.163.com';
                    port = 465;
                    break;
                case 'ali':
                    host = 'smtp.aliyun.com';
                    port = 465;
                    break;
                case 'gmail':
                    host = 'smtp.gmail.com';
                    port = 587;
                    break;
                case 'outlook':
                    host = 'smtp.office365.com';
                    port = 587;
                    break;
                default:
                    this.logger.warn(`Unknown email company: ${emailKey.emailCompany}, using default settings`);
                    host = 'smtp.example.com';
                    port = 587;
            }
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: {
                    user: emailKey.user,
                    pass: emailKey.pass,
                },
            });
            this.transporters.set(emailKey.id, transporter);
        }
        catch (error) {
            this.logger.error(`Error creating transporter for email key ${emailKey.id}:`, error);
        }
    }
    startProcessingQueue() {
        this.processingInterval = setInterval(() => {
            if (!this.isProcessing) {
                this.processQueue();
            }
        }, this.PROCESSING_INTERVAL_MS);
        this.logger.log('Email queue processor started');
    }
    async processQueue() {
        try {
            this.isProcessing = true;
            const pendingEmails = await this.emailQueueService.findPendingEmails(10);
            if (pendingEmails.length === 0) {
                return;
            }
            this.logger.log(`Processing ${pendingEmails.length} pending emails`);
            for (const email of pendingEmails) {
                await this.sendEmail(email);
            }
        }
        catch (error) {
            this.logger.error('Error processing email queue:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async sendEmail(email) {
        const transporter = this.transporters.get(email.emailKeyId);
        if (!transporter) {
            this.logger.error(`No transporter found for email key ${email.emailKeyId}`);
            await this.emailQueueService.markAsProcessed(email.id, email_queue_entity_1.EmailStatus.FAILED, 'No valid transporter found');
            return;
        }
        try {
            const emailKey = await this.emailKeysService.findOne(email.emailKeyId);
            if (!(await this.emailKeysService.canSendEmail(email.emailKeyId))) {
                this.logger.warn(`Email key ${email.emailKeyId} has reached its daily limit`);
                await this.emailQueueService.markAsProcessed(email.id, email_queue_entity_1.EmailStatus.FAILED, 'Daily sending limit reached');
                return;
            }
            const mailOptions = {
                from: `"${emailKey.app}" <${emailKey.user}>`,
                to: email.recipient,
                subject: email.subject,
                cc: email.cc || undefined,
                bcc: email.bcc || undefined,
            };
            if (email.contentType === 'html') {
                mailOptions['html'] = email.content;
            }
            else {
                mailOptions['text'] = email.content;
            }
            await transporter.sendMail(mailOptions);
            await this.emailQueueService.markAsProcessed(email.id, email_queue_entity_1.EmailStatus.SENT);
            this.logger.log(`Email ${email.id} sent successfully`);
        }
        catch (error) {
            this.logger.error(`Error sending email ${email.id}:`, error);
            await this.emailQueueService.markAsProcessed(email.id, email_queue_entity_1.EmailStatus.FAILED, error.message || 'Unknown error');
        }
    }
};
exports.EmailSenderService = EmailSenderService;
exports.EmailSenderService = EmailSenderService = EmailSenderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_queue_service_1.EmailQueueService,
        email_keys_service_1.EmailKeysService,
        cache_service_1.CacheService])
], EmailSenderService);
//# sourceMappingURL=email-sender.service.js.map