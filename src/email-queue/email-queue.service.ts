import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EmailQueue, EmailStatus } from './entities/email-queue.entity';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailKeysService } from '../email-keys/email-keys.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private readonly STATS_CACHE_KEY = 'email_queue_stats';
  private readonly STATS_CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(EmailQueue)
    private emailQueueRepository: Repository<EmailQueue>,
    private emailKeysService: EmailKeysService,
    private emailTemplatesService: EmailTemplatesService,
    private cacheService: CacheService,
  ) {
    // Initialize cache
    this.refreshStatsCache();
  }

  async queueEmail(sendEmailDto: SendEmailDto): Promise<EmailQueue> {
    // Get email keys for the app
    const emailKeys = await this.emailKeysService.findByApp(sendEmailDto.app);
    
    if (!emailKeys.length) {
      throw new NotFoundException(`No email keys found for app: ${sendEmailDto.app}`);
    }

    // Find an email key that hasn't reached its daily limit
    let selectedEmailKey = null;
    for (const key of emailKeys) {
      if (await this.emailKeysService.canSendEmail(key.id)) {
        selectedEmailKey = key;
        break;
      }
    }

    if (!selectedEmailKey) {
      throw new BadRequestException(`All email keys for app ${sendEmailDto.app} have reached their daily sending limit`);
    }

    // Verify template exists
    await this.emailTemplatesService.findOne(sendEmailDto.templateId);

    // Render template to get subject and content
    const rendered = await this.emailTemplatesService.renderTemplate(
      sendEmailDto.templateId,
      sendEmailDto.templateData,
    );

    // Format cc and bcc if they exist
    const formatRecipients = (recipients) => {
      if (!recipients || !recipients.length) return null;
      return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(',');
    };

    // Create queue entry
    const queueEntry = this.emailQueueRepository.create({
      app: sendEmailDto.app,
      recipient: sendEmailDto.recipientName 
        ? `${sendEmailDto.recipientName} <${sendEmailDto.recipient}>`
        : sendEmailDto.recipient,
      cc: formatRecipients(sendEmailDto.cc),
      bcc: formatRecipients(sendEmailDto.bcc),
      subject: rendered.subject,
      content: rendered.content,
      contentType: rendered.type,
      templateId: sendEmailDto.templateId,
      templateData: sendEmailDto.templateData,
      emailKeyId: selectedEmailKey.id,
      status: EmailStatus.PENDING,
    });

    const saved = await this.emailQueueRepository.save(queueEntry);
    await this.refreshStatsCache();
    return saved;
  }

  async findPendingEmails(limit: number = 10): Promise<EmailQueue[]> {
    return this.emailQueueRepository.find({
      where: {
        status: EmailStatus.PENDING,
      },
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });
  }

  async markAsProcessed(id: number, status: EmailStatus, errorMessage?: string): Promise<EmailQueue> {
    const email = await this.emailQueueRepository.findOne({ where: { id } });
    
    if (!email) {
      throw new NotFoundException(`Email queue item with ID ${id} not found`);
    }
    
    email.status = status;
    
    if (status === EmailStatus.SENT) {
      email.sentAt = new Date();
      await this.emailKeysService.incrementSentCount(email.emailKeyId);
    } else if (status === EmailStatus.FAILED) {
      email.errorMessage = errorMessage;
      email.retryCount += 1;
    }
    
    const updated = await this.emailQueueRepository.save(email);
    await this.refreshStatsCache();
    return updated;
  }

  async getQueueStats(): Promise<{ total: number; pending: number; sent: number; failed: number }> {
    return this.cacheService.getOrSet(
      this.STATS_CACHE_KEY,
      async () => {
        const total = await this.emailQueueRepository.count();
        const pending = await this.emailQueueRepository.count({ where: { status: EmailStatus.PENDING } });
        const sent = await this.emailQueueRepository.count({ where: { status: EmailStatus.SENT } });
        const failed = await this.emailQueueRepository.count({ where: { status: EmailStatus.FAILED } });
        
        return { total, pending, sent, failed };
      },
      this.STATS_CACHE_TTL,
    );
  }

  async getAppStatsByDateRange(app: string, startDate: Date, endDate: Date): Promise<{ sent: number; failed: number; pending: number }> {
    const sent = await this.emailQueueRepository.count({
      where: {
        app,
        status: EmailStatus.SENT,
        createdAt: Between(startDate, endDate),
      },
    });
    
    const failed = await this.emailQueueRepository.count({
      where: {
        app,
        status: EmailStatus.FAILED,
        createdAt: Between(startDate, endDate),
      },
    });
    
    const pending = await this.emailQueueRepository.count({
      where: {
        app,
        status: EmailStatus.PENDING,
        createdAt: Between(startDate, endDate),
      },
    });
    
    return { sent, failed, pending };
  }

  private async refreshStatsCache(): Promise<void> {
    const total = await this.emailQueueRepository.count();
    const pending = await this.emailQueueRepository.count({ where: { status: EmailStatus.PENDING } });
    const sent = await this.emailQueueRepository.count({ where: { status: EmailStatus.SENT } });
    const failed = await this.emailQueueRepository.count({ where: { status: EmailStatus.FAILED } });
    
    this.cacheService.set(
      this.STATS_CACHE_KEY,
      { total, pending, sent, failed },
      this.STATS_CACHE_TTL,
    );
    
    this.logger.log('Email queue stats cache refreshed');
  }
}