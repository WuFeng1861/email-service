import { Repository } from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CacheService } from '../cache/cache.service';
export declare class EmailTemplatesService {
    private templateRepository;
    private cacheService;
    private readonly logger;
    private readonly CACHE_KEY;
    private readonly CACHE_TTL;
    private compiledTemplates;
    constructor(templateRepository: Repository<EmailTemplate>, cacheService: CacheService);
    create(createTemplateDto: CreateTemplateDto): Promise<EmailTemplate>;
    findAll(): Promise<EmailTemplate[]>;
    findOne(id: number): Promise<EmailTemplate>;
    update(id: number, updateTemplateDto: UpdateTemplateDto): Promise<EmailTemplate>;
    remove(id: number): Promise<void>;
    refreshCache(): Promise<void>;
    private compileTemplate;
    renderTemplate(templateId: number, context: Record<string, any>): Promise<{
        content: string;
        subject: string;
        type: string;
    }>;
}
