import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailQueueController } from './email-queue.controller';
import { EmailQueueService } from './email-queue.service';
import { EmailSenderService } from './email-sender.service';
import { EmailQueue } from './entities/email-queue.entity';
import { EmailKeysModule } from '../email-keys/email-keys.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailQueue]),
    EmailKeysModule,
    EmailTemplatesModule,
  ],
  controllers: [EmailQueueController],
  providers: [EmailQueueService, EmailSenderService],
  exports: [EmailQueueService],
})
export class EmailQueueModule {}