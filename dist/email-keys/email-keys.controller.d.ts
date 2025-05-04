import { EmailKeysService } from './email-keys.service';
import { CreateEmailKeyDto } from './dto/create-email-key.dto';
import { UpdateEmailKeyDto } from './dto/update-email-key.dto';
import { EmailKey } from './entities/email-key.entity';
export declare class EmailKeysController {
    private readonly emailKeysService;
    constructor(emailKeysService: EmailKeysService);
    create(createEmailKeyDto: CreateEmailKeyDto): Promise<EmailKey>;
    findAll(): Promise<EmailKey[]>;
    findOne(id: number): Promise<EmailKey>;
    findByApp(app: string): Promise<EmailKey[]>;
    update(id: number, updateEmailKeyDto: UpdateEmailKeyDto): Promise<EmailKey>;
    remove(id: number): Promise<void>;
}
