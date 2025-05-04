import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailKeysController } from './email-keys.controller';
import { EmailKeysService } from './email-keys.service';
import { EmailKey } from './entities/email-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailKey])],
  controllers: [EmailKeysController],
  providers: [EmailKeysService],
  exports: [EmailKeysService],
})
export class EmailKeysModule {}