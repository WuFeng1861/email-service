import { Controller, Post, Body, Get, Query, HttpCode } from '@nestjs/common';
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

  /**
   * 老探活兼容：GET/HEAD /api/email/send → 204。
   *
   * 外部运维台（tianya-mainnet）判断「邮件网关可达」用的是
   * HEAD https://wufeng98.cn/emailServerApi/api/email/send。这个路径原本只有 POST，
   * Express 收到 HEAD 会落到 GET 链，最终 404，对方把 4xx 记成 degraded，
   * 于是那一格即使发信完全正常也一直显示异常。
   *
   * 这里只补一个只读探活：不查库、不发信、不返回正文，老调用方零改动。
   * HEAD 由 Express 自动复用 GET 处理器，不用单独注册。
   */
  @Public()
  @Get('send')
  @HttpCode(204)
  probeSend(): void {
    return;
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
