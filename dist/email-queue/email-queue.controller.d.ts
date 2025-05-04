import { EmailQueueService } from './email-queue.service';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailQueue } from './entities/email-queue.entity';
export declare class EmailQueueController {
    private readonly emailQueueService;
    constructor(emailQueueService: EmailQueueService);
    sendEmail(sendEmailDto: SendEmailDto): Promise<EmailQueue>;
    getQueueStats(): Promise<{
        total: number;
        pending: number;
        sent: number;
        failed: number;
    }>;
    getAppStats(app: string, startDate: string, endDate: string): Promise<{
        sent: number;
        failed: number;
        pending: number;
    }>;
}
