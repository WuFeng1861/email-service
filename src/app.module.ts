import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { dirname, join, isAbsolute } from 'path';
import { EmailKeysModule } from './email-keys/email-keys.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { EmailQueueModule } from './email-queue/email-queue.module';
import { StatisticsModule } from './statistics/statistics.module';
import { CacheModule } from './cache/cache.module';
import { SystemModule } from './system/system.module';
import { ProjectReportingModule } from './project-reporting/project-reporting.module';
import { AdminModule } from './admin/admin.module';
import { IpSecurityModule } from './ip-security/ip-security.module';
import { HealthController } from './health.controller';

function resolveDbFile(configService: ConfigService): string {
  const raw = configService.get<string>('DB_FILE') || 'data/email-server.db';
  return isAbsolute(raw) ? raw : join(process.cwd(), raw);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    AdminModule,
    IpSecurityModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const database = resolveDbFile(configService);
        mkdirSync(dirname(database), { recursive: true });

        return {
          type: 'better-sqlite3' as const,
          database,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          // 原实现硬编码 true：表结构随代码自动改。现在只认环境变量，默认关
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
          // 发送队列每 5 秒写一次；单写者模式下必须开 WAL + busy_timeout
          prepareDatabase: (db: {
            pragma: (sql: string) => unknown;
          }) => {
            db.pragma('journal_mode = WAL');
            db.pragma('busy_timeout = 5000');
            db.pragma('synchronous = NORMAL');
            db.pragma('foreign_keys = ON');
          },
        };
      },
    }),
    CacheModule,
    EmailKeysModule,
    EmailTemplatesModule,
    EmailQueueModule,
    StatisticsModule,
    SystemModule,
    ProjectReportingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
