import { Repository } from 'typeorm';
import { EmailQueue, EmailStatus } from './entities/email-queue.entity';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailKeysService } from '../email-keys/email-keys.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { CacheService } from '../cache/cache.service';
export declare class EmailQueueService {
    private emailQueueRepository;
    private emailKeysService;
    private emailTemplatesService;
    private cacheService;
    private readonly logger;
    private readonly STATS_CACHE_KEY;
    private readonly STATS_CACHE_TTL;
    constructor(emailQueueRepository: Repository<EmailQueue>, emailKeysService: EmailKeysService, emailTemplatesService: EmailTemplatesService, cacheService: CacheService);
    queueEmail(sendEmailDto: SendEmailDto): Promise<EmailQueue>;
    findPendingEmails(limit?: number): Promise<EmailQueue[]>;
    markAsProcessed(id: number, status: EmailStatus, errorMessage?: string): Promise<EmailQueue>;
    getQueueStats(): Promise<{
        total: number;
        pending: number;
        sent: number;
        failed: number;
    }>;
    getAppStatsByDateRange(app: string, startDate: Date, endDate: Date): Promise<{
        sent: number;
        failed: number;
        pending: number;
    }>;
    private refreshStatsCache;
}
