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
var EmailTemplatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_template_entity_1 = require("./entities/email-template.entity");
const cache_service_1 = require("../cache/cache.service");
const Handlebars = require("handlebars");
let EmailTemplatesService = EmailTemplatesService_1 = class EmailTemplatesService {
    constructor(templateRepository, cacheService) {
        this.templateRepository = templateRepository;
        this.cacheService = cacheService;
        this.logger = new common_1.Logger(EmailTemplatesService_1.name);
        this.CACHE_KEY = 'email_templates';
        this.CACHE_TTL = 3600;
        this.compiledTemplates = new Map();
        this.refreshCache();
    }
    async create(createTemplateDto) {
        const template = this.templateRepository.create(createTemplateDto);
        const saved = await this.templateRepository.save(template);
        await this.refreshCache();
        this.compileTemplate(saved);
        return saved;
    }
    async findAll() {
        return this.cacheService.getOrSet(this.CACHE_KEY, async () => {
            this.logger.log('Cache miss for email templates, fetching from database');
            const templates = await this.templateRepository.find();
            templates.forEach(template => this.compileTemplate(template));
            return templates;
        }, this.CACHE_TTL);
    }
    async findOne(id) {
        const templates = await this.findAll();
        const template = templates.find(t => t.id === id);
        if (!template) {
            throw new common_1.NotFoundException(`Email template with ID ${id} not found`);
        }
        return template;
    }
    async update(id, updateTemplateDto) {
        const template = await this.findOne(id);
        Object.assign(template, updateTemplateDto);
        const updated = await this.templateRepository.save(template);
        await this.refreshCache();
        this.compileTemplate(updated);
        return updated;
    }
    async remove(id) {
        const template = await this.findOne(id);
        await this.templateRepository.remove(template);
        this.compiledTemplates.delete(id);
        await this.refreshCache();
    }
    async refreshCache() {
        const templates = await this.templateRepository.find();
        this.cacheService.set(this.CACHE_KEY, templates, this.CACHE_TTL);
        templates.forEach(template => this.compileTemplate(template));
        this.logger.log('Email templates cache refreshed');
    }
    compileTemplate(template) {
        try {
            const compiled = Handlebars.compile(template.content);
            this.compiledTemplates.set(template.id, compiled);
        }
        catch (error) {
            this.logger.error(`Failed to compile template ${template.id}:`, error.message);
        }
    }
    async renderTemplate(templateId, context) {
        const template = await this.findOne(templateId);
        let compiled = this.compiledTemplates.get(templateId);
        if (!compiled) {
            this.compileTemplate(template);
            compiled = this.compiledTemplates.get(templateId);
        }
        if (!compiled) {
            throw new Error(`Template ${templateId} is not compiled properly`);
        }
        try {
            const content = compiled(context);
            return {
                content,
                subject: template.subject,
                type: template.type,
            };
        }
        catch (error) {
            this.logger.error(`Error rendering template ${templateId}:`, error.message);
            throw error;
        }
    }
};
exports.EmailTemplatesService = EmailTemplatesService;
exports.EmailTemplatesService = EmailTemplatesService = EmailTemplatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_template_entity_1.EmailTemplate)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cache_service_1.CacheService])
], EmailTemplatesService);
//# sourceMappingURL=email-templates.service.js.map