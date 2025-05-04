import { EmailQueueService } from '../email-queue/email-queue.service';
import { EmailKeysService } from '../email-keys/email-keys.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
export declare class StatisticsService {
    private emailQueueService;
    private emailKeysService;
    private emailTemplatesService;
    constructor(emailQueueService: EmailQueueService, emailKeysService: EmailKeysService, emailTemplatesService: EmailTemplatesService);
    getSystemStats(): Promise<{
        emailQueue: {
            total: number;
            pending: number;
            sent: number;
            failed: number;
        };
        emailKeys: {
            total: number;
            byApp: {};
        };
        templates: {
            total: number;
        };
    }>;
}
