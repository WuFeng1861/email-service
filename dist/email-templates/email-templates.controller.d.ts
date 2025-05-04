import { EmailTemplatesService } from './email-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { EmailTemplate } from './entities/email-template.entity';
export declare class EmailTemplatesController {
    private readonly templatesService;
    constructor(templatesService: EmailTemplatesService);
    create(createTemplateDto: CreateTemplateDto): Promise<EmailTemplate>;
    findAll(): Promise<EmailTemplate[]>;
    findOne(id: number): Promise<EmailTemplate>;
    update(id: number, updateTemplateDto: UpdateTemplateDto): Promise<EmailTemplate>;
    remove(id: number): Promise<void>;
}
