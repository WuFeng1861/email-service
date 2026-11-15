import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { Public } from '../common/decorators/public.decorator';

/**
 * 统计接口只返回数量，不含任何凭证，保持公开以免打断现有看板/监控。
 * 凭证、模板、重启这些「能改东西或能拿到秘密」的接口才要求管理员登录。
 */
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  @Public()
  @Get()
  getSystemStats() {
    return this.statisticsService.getSystemStats();
  }

  @Public()
  @Get('app')
  getAppStats(
    @Query('app') app: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.emailQueueService.getAppStatsByDateRange(app, start, end);
  }
}
