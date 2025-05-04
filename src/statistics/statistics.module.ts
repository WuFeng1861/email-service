import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { EmailQueueModule } from '../email-queue/email-queue.module';
import { EmailKeysModule } from '../email-keys/email-keys.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';

@Module({
  imports: [EmailQueueModule, EmailKeysModule, EmailTemplatesModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}