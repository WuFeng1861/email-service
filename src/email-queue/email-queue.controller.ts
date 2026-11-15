import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailQueue } from './entities/email-queue.entity';
import { Public } from '../common/decorators/public.decorator';

@Controller('email')
export class EmailQueueController {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  /**
   * 发信接口保持公开 —— 这是给其它服务调用的，改成要登录会直接打断现有程序。
   * 风险由另外两层兜住：只监听回环（必须经 Nginx）+ Nginx 侧限流。
   */
  @Public()
  @Post('send')
  sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<EmailQueue> {
    return this.emailQueueService.queueEmail(sendEmailDto);
  }

  // 统计接口也保持公开：只暴露数量，不含凭证；老看板/监控还在用
  @Public()
  @Get('stats')
  getQueueStats() {
    return this.emailQueueService.getQueueStats();
  }

  @Public()
  @Get('app-stats')
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
