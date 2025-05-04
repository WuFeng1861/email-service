import { Injectable } from '@nestjs/common';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { EmailKeysService } from '../email-keys/email-keys.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';

@Injectable()
export class StatisticsService {
  constructor(
    private emailQueueService: EmailQueueService,
    private emailKeysService: EmailKeysService,
    private emailTemplatesService: EmailTemplatesService,
  ) {}

  async getSystemStats() {
    // Get overall email stats
    const queueStats = await this.emailQueueService.getQueueStats();
    
    // Get count of email keys
    const emailKeys = await this.emailKeysService.findAll();
    const emailKeysCount = emailKeys.length;
    
    // Get count of email templates
    const templates = await this.emailTemplatesService.findAll();
    const templatesCount = templates.length;
    
    // Group email keys by app
    const appStats = emailKeys.reduce((acc, curr) => {
      if (!acc[curr.app]) {
        acc[curr.app] = {
          count: 0,
          totalDailyLimit: 0,
        };
      }
      
      acc[curr.app].count += 1;
      acc[curr.app].totalDailyLimit += curr.limitCount;
      
      return acc;
    }, {});
    
    return {
      emailQueue: queueStats,
      emailKeys: {
        total: emailKeysCount,
        byApp: appStats,
      },
      templates: {
        total: templatesCount,
      },
    };
  }
}