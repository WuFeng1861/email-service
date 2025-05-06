import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';
import { EmailKeysService } from '../email-keys/email-keys.service';
import { EmailStatus } from './entities/email-queue.entity';
import * as nodemailer from 'nodemailer';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class EmailSenderService implements OnModuleInit {
  private readonly logger = new Logger(EmailSenderService.name);
  private transporters: Map<number, nodemailer.Transporter> = new Map();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout;
  private readonly PROCESSING_INTERVAL_MS = 5000; // 5 seconds

  constructor(
    private emailQueueService: EmailQueueService,
    private emailKeysService: EmailKeysService,
    private cacheService: CacheService,
  ) {}

  onModuleInit() {
    this.initializeTransporters();
    this.startProcessingQueue();
  }

  private async initializeTransporters(): Promise<void> {
    const emailKeys = await this.emailKeysService.findAll();
    
    for (const key of emailKeys) {
      this.createTransporter(key);
    }
    
    this.logger.log(`Initialized ${this.transporters.size} email transporters`);
  }

  private createTransporter(emailKey: any): void {
    try {
      let host, port;
      
      // Configure host and port based on email company
      switch (emailKey.emailCompany.toLowerCase()) {
        case 'qq':
          host = 'smtp.qq.com';
          port = 25;
          break;
        case '163':
          host = 'smtphz.qiye.163.com';
          port = 25;
          break;
        case 'ali':
          host = 'smtp.aliyun.com';
          port = 465;
          break;
        case 'gmail':
          host = 'smtp.gmail.com';
          port = 587;
          break;
        case 'outlook':
          host = 'smtp.office365.com';
          port = 587;
          break;
        default:
          this.logger.warn(`Unknown email company: ${emailKey.emailCompany}, using default settings`);
          host = 'smtp.example.com';
          port = 587;
      }
      
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: emailKey.user,
          pass: emailKey.pass,
        },
      });
      
      this.transporters.set(emailKey.id, transporter);
    } catch (error) {
      this.logger.error(`Error creating transporter for email key ${emailKey.id}:`, error);
    }
  }

  private startProcessingQueue(): void {
    this.processingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processQueue();
      }
    }, this.PROCESSING_INTERVAL_MS);
    
    this.logger.log('Email queue processor started');
  }

  private async processQueue(): Promise<void> {
    try {
      this.isProcessing = true;
      
      // Get pending emails (limit to 10 at a time)
      const pendingEmails = await this.emailQueueService.findPendingEmails(10);
      
      if (pendingEmails.length === 0) {
        return;
      }
      
      this.logger.log(`Processing ${pendingEmails.length} pending emails`);
      
      for (const email of pendingEmails) {
        await this.sendEmail(email);
      }
    } catch (error) {
      this.logger.error('Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendEmail(email: any): Promise<void> {
    try {
      let emailKey = await this.emailKeysService.findOne(email.emailKeyId);
      
      // Check if email key can send more emails today
      if (!(await this.emailKeysService.canSendEmail(email.emailKeyId))) {
        
        let newEmailKey = await this.emailKeysService.findOtherSameAppKeyById(email.emailKeyId);
        if (!newEmailKey) {
          this.logger.warn(`Email key ${email.emailKeyId} has reached its daily limit`);
          await this.emailQueueService.markAsProcessed(
            email.id,
            EmailStatus.FAILED,
            email.emailKeyId,
            'Daily sending limit reached',
          );
          return;
        }
        emailKey = newEmailKey;
      }
      
      // Prepare mail options
      const mailOptions = {
        from: `"${emailKey.app}" <${emailKey.user}>`,
        to: email.recipient,
        subject: email.subject,
        cc: email.cc || undefined,
        bcc: email.bcc || undefined,
      };
      
      // Set content based on content type
      if (email.contentType === 'html') {
        mailOptions['html'] = email.content;
      } else {
        mailOptions['text'] = email.content;
      }
  
      const transporter = this.transporters.get(emailKey.id);
  
      if (!transporter) {
        this.logger.error(`No transporter found for email key ${emailKey.id}`);
        await this.emailQueueService.markAsProcessed(
          email.id,
          EmailStatus.FAILED,
          email.emailKeyId,
          'No valid transporter found',
        );
        return;
      }
      
      // Send email
      await transporter.sendMail(mailOptions);
      
      // Mark as sent
      await this.emailQueueService.markAsProcessed(emailKey.id, EmailStatus.SENT, email.emailKeyId);
      this.logger.log(`Email ${email.id} sent successfully`);
    } catch (error) {
      this.logger.error(`Error sending email ${email.id}:`, error);
      await this.emailQueueService.markAsProcessed(
        email.id,
        EmailStatus.FAILED,
        email.emailKeyId,
        error.message || 'Unknown error',
      );
    }
  }
}
