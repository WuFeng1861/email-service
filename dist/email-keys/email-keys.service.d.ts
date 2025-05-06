import { Repository } from 'typeorm';
import { EmailKey } from './entities/email-key.entity';
import { CreateEmailKeyDto } from './dto/create-email-key.dto';
import { UpdateEmailKeyDto } from './dto/update-email-key.dto';
import { CacheService } from '../cache/cache.service';
export declare class EmailKeysService {
    private emailKeyRepository;
    private cacheService;
    private readonly logger;
    private readonly CACHE_KEY;
    private readonly CACHE_TTL;
    constructor(emailKeyRepository: Repository<EmailKey>, cacheService: CacheService);
    create(createEmailKeyDto: CreateEmailKeyDto): Promise<EmailKey>;
    findAll(): Promise<EmailKey[]>;
    findOne(id: number): Promise<EmailKey>;
    findOtherSameAppKeyById(id: number): Promise<EmailKey | null>;
    findByApp(app: string): Promise<EmailKey[]>;
    update(id: number, updateEmailKeyDto: UpdateEmailKeyDto): Promise<EmailKey>;
    remove(id: number): Promise<void>;
    refreshCache(): Promise<void>;
    incrementSentCount(id: number): Promise<EmailKey>;
    canSendEmail(id: number): Promise<boolean>;
}
