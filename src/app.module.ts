import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailKeysModule } from './email-keys/email-keys.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { EmailQueueModule } from './email-queue/email-queue.module';
import { StatisticsModule } from './statistics/statistics.module';
import { CacheModule } from './cache/cache.module';
import { SystemModule } from './system/system.module';
import { ProjectReportingModule } from './project-reporting/project-reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', 'root'),
        database: configService.get('DB_DATABASE', 'email_service'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    CacheModule,
    EmailKeysModule,
    EmailTemplatesModule,
    EmailQueueModule,
    StatisticsModule,
    SystemModule,
    ProjectReportingModule,
  ],
})
export class AppModule {}
