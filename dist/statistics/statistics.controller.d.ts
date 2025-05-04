import { StatisticsService } from './statistics.service';
import { EmailQueueService } from '../email-queue/email-queue.service';
export declare class StatisticsController {
    private readonly statisticsService;
    private readonly emailQueueService;
    constructor(statisticsService: StatisticsService, emailQueueService: EmailQueueService);
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
    getAppStats(app: string, startDate: string, endDate: string): Promise<{
        sent: number;
        failed: number;
        pending: number;
    }>;
}
