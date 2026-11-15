import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { EmailQueue, EmailStatus } from './entities/email-queue.entity';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailKeysService } from '../email-keys/email-keys.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private readonly STATS_CACHE_KEY = 'email_queue_stats';
  private readonly STATS_CACHE_TTL = 300;

  constructor(
    @InjectRepository(EmailQueue)
    private emailQueueRepository: Repository<EmailQueue>,
    private emailKeysService: EmailKeysService,
    private emailTemplatesService: EmailTemplatesService,
    private cacheService: CacheService,
  ) {}

  async queueEmail(sendEmailDto: SendEmailDto): Promise<EmailQueue> {
    const emailKeys = await this.emailKeysService.findByApp(sendEmailDto.app);

    if (!emailKeys.length) {
      throw new NotFoundException(`No email keys found for app: ${sendEmailDto.app}`);
    }

    let selectedEmailKey = null;
    for (const key of emailKeys) {
      if (await this.emailKeysService.canSendEmail(key.id)) {
        selectedEmailKey = key;
        break;
      }
    }

    if (!selectedEmailKey) {
      throw new BadRequestException(
        `All email keys for app ${sendEmailDto.app} have reached their daily sending limit`,
      );
    }

    await this.emailTemplatesService.findOne(sendEmailDto.templateId);

    const rendered = await this.emailTemplatesService.renderTemplate(
      sendEmailDto.templateId,
      sendEmailDto.templateData,
    );

    const formatRecipients = (recipients?: { email: string; name?: string }[]) => {
      if (!recipients || !recipients.length) return null;
      return recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(',');
    };

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
      nextAttemptAt: null,
      retryCount: 0,
    });

    const saved = await this.emailQueueRepository.save(queueEntry);
    // 只失效缓存，不再每次发送都跑 4 次 COUNT(*)
    this.cacheService.delete(this.STATS_CACHE_KEY);
    return saved;
  }

  /** 只取「到时间了 + 没超过重试次数」的邮件 */
  async findPendingEmails(limit = 10): Promise<EmailQueue[]> {
    const now = new Date();
    return this.emailQueueRepository.find({
      where: [
        { status: EmailStatus.PENDING, nextAttemptAt: IsNull() },
        { status: EmailStatus.PENDING, nextAttemptAt: LessThanOrEqual(now) },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async markAsProcessed(
    id: number,
    status: EmailStatus,
    sendEmailKeyId: number,
    errorMessage?: string,
  ): Promise<EmailQueue> {
    const email = await this.emailQueueRepository.findOne({ where: { id } });
    if (!email) {
      throw new NotFoundException(`Email queue item with ID ${id} not found`);
    }

    email.status = status;
    email.nextAttemptAt = null;

    if (status === EmailStatus.SENT) {
      email.sentAt = new Date();
      email.errorMessage = null;
      await this.emailKeysService.incrementSentCount(sendEmailKeyId);
      email.emailKeyId = sendEmailKeyId;
    } else if (status === EmailStatus.FAILED) {
      email.errorMessage = errorMessage;
      email.retryCount += 1;
    }

    const updated = await this.emailQueueRepository.save(email);
    this.cacheService.delete(this.STATS_CACHE_KEY);
    return updated;
  }

  /**
   * 延后重试：状态仍是 PENDING，只是下次尝试时间往后挪。
   *
   * 原实现遇到「当日配额用尽」直接标 FAILED，等于把信永久丢掉
   * （审计里 898 封失败大部分就是这么来的）。
   */
  async defer(id: number, reason: string, delayMs: number): Promise<void> {
    const email = await this.emailQueueRepository.findOne({ where: { id } });
    if (!email) return;

    const retryCount = email.retryCount + 1;
    const maxRetry = email.maxRetry ?? 5;

    if (retryCount >= maxRetry) {
      await this.markAsProcessed(id, EmailStatus.FAILED, email.emailKeyId, reason);
      return;
    }

    email.status = EmailStatus.PENDING;
    email.retryCount = retryCount;
    email.errorMessage = reason;
    email.nextAttemptAt = new Date(Date.now() + delayMs);

    await this.emailQueueRepository.save(email);
    this.cacheService.delete(this.STATS_CACHE_KEY);
    this.logger.warn(
      `邮件 ${id} 延后重试（第 ${retryCount}/${maxRetry} 次，${Math.round(delayMs / 1000)}s 后）：${reason}`,
    );
  }

  async getQueueStats(): Promise<{ total: number; pending: number; sent: number; failed: number }> {
    return this.cacheService.getOrSet(
      this.STATS_CACHE_KEY,
      async () => {
        const total = await this.emailQueueRepository.count();
        const pending = await this.emailQueueRepository.count({
          where: { status: EmailStatus.PENDING },
        });
        const sent = await this.emailQueueRepository.count({
          where: { status: EmailStatus.SENT },
        });
        const failed = await this.emailQueueRepository.count({
          where: { status: EmailStatus.FAILED },
        });
        return { total, pending, sent, failed };
      },
      this.STATS_CACHE_TTL,
    );
  }

  async getAppStatsByDateRange(
    app: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ sent: number; failed: number; pending: number }> {
    const sent = await this.emailQueueRepository.count({
      where: { app, status: EmailStatus.SENT, createdAt: Between(startDate, endDate) },
    });
    const failed = await this.emailQueueRepository.count({
      where: { app, status: EmailStatus.FAILED, createdAt: Between(startDate, endDate) },
    });
    const pending = await this.emailQueueRepository.count({
      where: { app, status: EmailStatus.PENDING, createdAt: Between(startDate, endDate) },
    });
    return { sent, failed, pending };
  }
}
