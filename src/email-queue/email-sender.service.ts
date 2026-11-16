import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailQueueService } from './email-queue.service';
import { EmailKeysService } from '../email-keys/email-keys.service';
import { EmailStatus } from './entities/email-queue.entity';
import { EmailKey } from '../email-keys/entities/email-key.entity';
import { resolveSmtpProfile } from '../common/smtp-profiles';

/**
 * 审计发现的两个致命点都在这里：
 *  1) transporter 只在 onModuleInit 建一次 → key 16 是启动后新增的，
 *     永远拿不到 transporter，导致 898 封邮件全部 FAILED。
 *  2) qq/163 用 25 端口明文，PLAINTEXT 一律被服务商拒。
 */
@Injectable()
export class EmailSenderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailSenderService.name);

  private readonly transporters = new Map<number, nodemailer.Transporter>();
  private readonly inflight = new Map<number, Promise<nodemailer.Transporter>>();

  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;
  private lastFailedCount = -1;

  private readonly PROCESSING_INTERVAL_MS = 5000;
  private readonly BATCH_SIZE = 10;

  constructor(
    private readonly emailQueueService: EmailQueueService,
    private readonly emailKeysService: EmailKeysService,
  ) {}

  onModuleInit(): void {
    // 不再预热遍历：预热只是提前把授权码读进内存，没有收益，
    // 而且新增 key 永远拿不到 transporter。改成发信时懒建。
    this.timer = setInterval(() => {
      if (!this.isProcessing) void this.processQueue();
    }, this.PROCESSING_INTERVAL_MS);
    this.logger.log(`邮件队列处理器已启动（每 ${this.PROCESSING_INTERVAL_MS / 1000}s 扫描一次）`);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    for (const t of this.transporters.values()) {
      try {
        t.close();
      } catch {
        /* ignore */
      }
    }
    this.transporters.clear();
  }

  /** key 增删改后调用，让下一个发送任务重建连接 */
  invalidate(keyId?: number): void {
    if (keyId === undefined) {
      this.transporters.clear();
      return;
    }
    this.transporters.delete(keyId);
  }

  private buildTransporter(key: EmailKey): nodemailer.Transporter {
    const profile = resolveSmtpProfile(key.emailCompany);

    if (profile.host === 'smtp.example.com') {
      this.logger.warn(`未知邮箱服务商: ${key.emailCompany}（key ${key.id}），请检查配置`);
    }

    return nodemailer.createTransport({
      host: profile.host,
      port: profile.port,
      secure: profile.secure,
      requireTLS: profile.requireTLS,
      auth: { user: key.user, pass: key.pass },
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  /** 懒加载 + 并发去重：同一个 key 同时只有一个在建 */
  private async getTransporter(keyId: number): Promise<nodemailer.Transporter> {
    const cached = this.transporters.get(keyId);
    if (cached) return cached;

    let pending = this.inflight.get(keyId);
    if (!pending) {
      pending = (async () => {
        const key = await this.emailKeysService.findSecret(keyId);
        const transporter = this.buildTransporter(key);
        this.transporters.set(keyId, transporter);
        this.logger.log(`已为邮箱 key ${keyId}（${key.emailCompany}）建立 SMTP 连接`);
        return transporter;
      })().finally(() => this.inflight.delete(keyId));
      this.inflight.set(keyId, pending);
    }
    return pending;
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    try {
      const pendingEmails = await this.emailQueueService.findPendingEmails(this.BATCH_SIZE);
      if (!pendingEmails.length) {
        await this.checkFailureAlert();
        return;
      }

      this.logger.log(`处理 ${pendingEmails.length} 封待发邮件`);
      for (const email of pendingEmails) {
        await this.sendEmail(email);
      }
      await this.checkFailureAlert();
    } catch (error) {
      this.logger.error(`队列处理异常: ${(error as Error)?.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  private isPermanentError(message: string): boolean {
    return /invalid login|authentication|username and password not accepted|5\d\d[ -]|mailbox unavailable|does not exist|recipient address rejected/i.test(
      message,
    );
  }

  private async sendEmail(email: {
    id: number;
    recipient: string;
    subject: string;
    content: string;
    contentType: string;
    cc: string;
    bcc: string;
    emailKeyId: number;
    retryCount: number;
  }): Promise<void> {
    let emailKey: EmailKey;
    try {
      emailKey = await this.emailKeysService.findOne(email.emailKeyId);
    } catch (error) {
      await this.emailQueueService.markAsProcessed(
        email.id,
        EmailStatus.FAILED,
        email.emailKeyId,
        '邮箱 key 不存在',
      );
      return;
    }

    // 配额用尽：先换同 app 的其它 key，换不到就延后，不再永久失败
    if (!(await this.emailKeysService.canSendEmail(email.emailKeyId))) {
      const alternative = await this.emailKeysService.findOtherSameAppKeyById(email.emailKeyId);
      if (!alternative) {
        await this.emailQueueService.defer(
          email.id,
          '当日发送配额已用尽，等待次日重置',
          30 * 60 * 1000,
        );
        return;
      }
      emailKey = alternative;
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${emailKey.app}" <${emailKey.user}>`,
      to: email.recipient,
      subject: email.subject,
      cc: email.cc || undefined,
      bcc: email.bcc || undefined,
    };
    if (email.contentType === 'html') {
      mailOptions.html = email.content;
    } else {
      mailOptions.text = email.content;
    }

    try {
      const transporter = await this.getTransporter(emailKey.id);
      await transporter.sendMail(mailOptions);
      await this.emailQueueService.markAsProcessed(email.id, EmailStatus.SENT, emailKey.id);
      this.logger.log(`邮件 ${email.id} 已发送（key ${emailKey.id}）`);
    } catch (error) {
      const message = (error as Error)?.message || 'Unknown error';

      // 授权码被重置/失效：丢掉旧连接，下一轮重建
      if (/auth|login|password/i.test(message)) {
        this.invalidate(emailKey.id);
      }

      if (this.isPermanentError(message)) {
        await this.emailQueueService.markAsProcessed(
          email.id,
          EmailStatus.FAILED,
          emailKey.id,
          message,
        );
        this.logger.error(`邮件 ${email.id} 永久失败: ${message}`);
        return;
      }

      // 临时性错误：指数退避 1/2/4/8/10 分钟
      const delayMs = Math.min(Math.pow(2, email.retryCount ?? 0), 10) * 60 * 1000;
      await this.emailQueueService.defer(email.id, message, delayMs);
    }
  }

  /** 失败数只增不减说明链路挂了；没有告警就是审计里 898 封静默失败的原因 */
  private async checkFailureAlert(): Promise<void> {
    try {
      const { failed, pending } = await this.emailQueueService.getQueueStats();
      if (this.lastFailedCount >= 0 && failed > this.lastFailedCount) {
        this.logger.error(
          `[ALERT] 发送失败新增 ${failed - this.lastFailedCount} 封（累计 ${failed}，待发 ${pending}），请检查 SMTP 授权码与配额`,
        );
      }
      this.lastFailedCount = failed;
    } catch {
      /* 统计失败不影响发送 */
    }
  }
}
