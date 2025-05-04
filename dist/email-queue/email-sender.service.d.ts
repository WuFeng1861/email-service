import { OnModuleInit } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';
import { EmailKeysService } from '../email-keys/email-keys.service';
import { CacheService } from '../cache/cache.service';
export declare class EmailSenderService implements OnModuleInit {
    private emailQueueService;
    private emailKeysService;
    private cacheService;
    private readonly logger;
    private transporters;
    private isProcessing;
    private processingInterval;
    private readonly PROCESSING_INTERVAL_MS;
    constructor(emailQueueService: EmailQueueService, emailKeysService: EmailKeysService, cacheService: CacheService);
    onModuleInit(): void;
    private initializeTransporters;
    private createTransporter;
    private startProcessingQueue;
    private processQueue;
    private sendEmail;
}
