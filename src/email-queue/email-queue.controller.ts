import { Controller, Post, Body, Get, Query, ParseIntPipe } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailQueue } from './entities/email-queue.entity';

@Controller('email')
export class EmailQueueController {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @Post('send')
  sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<EmailQueue> {
    return this.emailQueueService.queueEmail(sendEmailDto);
  }

  @Get('stats')
  getQueueStats() {
    return this.emailQueueService.getQueueStats();
  }

  @Get('app-stats')
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