import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Handlebars from 'handlebars';
import { EmailTemplate } from './entities/email-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);
  private readonly CACHE_KEY = 'email_templates';
  private readonly CACHE_TTL = 600;

  private compiledTemplates = new Map<number, Handlebars.TemplateDelegate>();
  private compiledSubjects = new Map<number, Handlebars.TemplateDelegate>();

  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
    private cacheService: CacheService,
  ) {}

  async create(createTemplateDto: CreateTemplateDto): Promise<EmailTemplate> {
    const template = this.templateRepository.create(createTemplateDto);
    const saved = await this.templateRepository.save(template);
    await this.refreshCache();
    return saved;
  }

  /** 内部用：完整列表进缓存，renderTemplate/findOne 都依赖它 */
  async findAll(): Promise<EmailTemplate[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY,
      async () => {
        const templates = await this.templateRepository.find();
        templates.forEach((t) => this.compileTemplate(t));
        return templates;
      },
      this.CACHE_TTL,
    );
  }

  /**
   * 接口用：审计时 GET /api/email-templates 一次返回 152 个模板 + 完整正文，
   * 前端列表页拿不动。这里做分页，正文列表里截断，详情再取全量。
   */
  async findPaginated(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [items, total] = await this.templateRepository.findAndCount({
      order: { id: 'DESC' },
      skip: (Math.max(page, 1) - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      items: items.map((t) => ({
        id: t.id,
        name: (t as unknown as { name?: string }).name,
        subject: t.subject,
        type: t.type,
        preview: String(t.content || '').slice(0, 200),
        updatedAt: (t as unknown as { updatedAt?: Date }).updatedAt,
      })),
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
        currentPage: Math.max(page, 1),
      },
    };
  }

  async findOne(id: number): Promise<EmailTemplate> {
    const templates = await this.findAll();
    const template = templates.find((t) => t.id === id);
    if (!template) {
      throw new NotFoundException(`Email template with ID ${id} not found`);
    }
    return template;
  }

  async update(id: number, updateTemplateDto: UpdateTemplateDto): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, updateTemplateDto);
    const updated = await this.templateRepository.save(template);
    await this.refreshCache();
    return updated;
  }

  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
    this.compiledTemplates.delete(id);
    this.compiledSubjects.delete(id);
    await this.refreshCache();
  }

  async refreshCache(): Promise<void> {
    const templates = await this.templateRepository.find();
    this.cacheService.set(this.CACHE_KEY, templates, this.CACHE_TTL);
    templates.forEach((t) => this.compileTemplate(t));
    this.logger.debug(`Email templates cache refreshed (${templates.length})`);
  }

  private compileTemplate(template: EmailTemplate): void {
    try {
      this.compiledTemplates.set(template.id, Handlebars.compile(template.content ?? ''));
    } catch (error) {
      this.compiledTemplates.delete(template.id);
      this.logger.error(`模板 ${template.id} 编译失败: ${(error as Error).message}`);
    }
    // 主题单独编译：主题失败不该拦下正文
    try {
      this.compiledSubjects.set(template.id, Handlebars.compile(template.subject ?? ''));
    } catch (error) {
      this.compiledSubjects.delete(template.id);
      this.logger.error(`模板 ${template.id} 主题编译失败: ${(error as Error).message}`);
    }
  }

  async renderTemplate(
    templateId: number,
    context: Record<string, any>,
  ): Promise<{ content: string; subject: string; type: string }> {
    const template = await this.findOne(templateId);

    let compiled = this.compiledTemplates.get(templateId);
    if (!compiled) {
      this.compileTemplate(template);
      compiled = this.compiledTemplates.get(templateId);
    }
    if (!compiled) {
      throw new Error(`Template ${templateId} is not compiled properly`);
    }

    let compiledSubject = this.compiledSubjects.get(templateId);
    if (!compiledSubject) {
      try {
        compiledSubject = Handlebars.compile(template.subject ?? '');
        this.compiledSubjects.set(templateId, compiledSubject);
      } catch (error) {
        this.logger.error(`主题编译失败 ${templateId}: ${(error as Error).message}`);
      }
    }

    try {
      const content = compiled(context ?? {});
      // 主题必须一起渲染，否则 {{占位符}} 会原样出现在收件箱标题里
      let subject = template.subject;
      if (compiledSubject) {
        try {
          subject = compiledSubject(context ?? {});
        } catch (error) {
          this.logger.error(`主题渲染失败 ${templateId}: ${(error as Error).message}`);
        }
      }
      return { content, subject, type: template.type };
    } catch (error) {
      this.logger.error(`模板渲染失败 ${templateId}: ${(error as Error).message}`);
      throw error;
    }
  }
}
