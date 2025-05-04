import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { EmailQueueService } from '../email-queue/email-queue.service';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  @Get()
  getSystemStats() {
    return this.statisticsService.getSystemStats();
  }

  @Get('app')
  getAppStats(
    @Query('app') app: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.emailQueueService.getAppStatsByDateRange(app, start, end);
  }
}