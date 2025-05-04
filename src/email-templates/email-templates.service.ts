import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CacheService } from '../cache/cache.service';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);
  private readonly CACHE_KEY = 'email_templates';
  private readonly CACHE_TTL = 3600; // 1 hour
  private compiledTemplates: Map<number, Handlebars.TemplateDelegate> = new Map();

  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
    private cacheService: CacheService,
  ) {
    // Initialize cache when service starts
    this.refreshCache();
  }

  async create(createTemplateDto: CreateTemplateDto): Promise<EmailTemplate> {
    const template = this.templateRepository.create(createTemplateDto);
    const saved = await this.templateRepository.save(template);
    await this.refreshCache();
    this.compileTemplate(saved);
    return saved;
  }

  async findAll(): Promise<EmailTemplate[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY,
      async () => {
        this.logger.log('Cache miss for email templates, fetching from database');
        const templates = await this.templateRepository.find();
        templates.forEach(template => this.compileTemplate(template));
        return templates;
      },
      this.CACHE_TTL,
    );
  }

  async findOne(id: number): Promise<EmailTemplate> {
    const templates = await this.findAll();
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      throw new NotFoundException(`Email template with ID ${id} not found`);
    }
    
    return template;
  }

  async update(id: number, updateTemplateDto: UpdateTemplateDto): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    
    // Update fields
    Object.assign(template, updateTemplateDto);
    
    const updated = await this.templateRepository.save(template);
    await this.refreshCache();
    this.compileTemplate(updated);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
    this.compiledTemplates.delete(id);
    await this.refreshCache();
  }

  async refreshCache(): Promise<void> {
    const templates = await this.templateRepository.find();
    this.cacheService.set(this.CACHE_KEY, templates, this.CACHE_TTL);
    templates.forEach(template => this.compileTemplate(template));
    this.logger.log('Email templates cache refreshed');
  }

  private compileTemplate(template: EmailTemplate): void {
    try {
      const compiled = Handlebars.compile(template.content);
      this.compiledTemplates.set(template.id, compiled);
    } catch (error) {
      this.logger.error(`Failed to compile template ${template.id}:`, error.message);
    }
  }

  async renderTemplate(templateId: number, context: Record<string, any>): Promise<{ content: string; subject: string; type: string }> {
    const template = await this.findOne(templateId);
    let compiled = this.compiledTemplates.get(templateId);
    
    if (!compiled) {
      this.compileTemplate(template);
      compiled = this.compiledTemplates.get(templateId);
    }
    
    if (!compiled) {
      throw new Error(`Template ${templateId} is not compiled properly`);
    }

    // Render template with context
    try {
      const content = compiled(context);
      return {
        content,
        subject: template.subject,
        type: template.type,
      };
    } catch (error) {
      this.logger.error(`Error rendering template ${templateId}:`, error.message);
      throw error;
    }
  }
}