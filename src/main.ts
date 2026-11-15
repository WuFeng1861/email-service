import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
// helmet 7 的类型声明是 ESM 风格，CJS 构建下直接 require 最稳
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require('helmet');
import { AppModule } from './app.module';
import { AdminGuard } from './admin/guards/admin.guard';
import { AdminService } from './admin/admin.service';
import { IpSecurityMiddleware } from './ip-security/middleware/ip-security.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // 单层反代 = 1；双层（老机器 Nginx → 新机器 Nginx）设 TRUST_PROXY=2
  {
    const hops = Number(process.env.TRUST_PROXY ?? 1);
    app.set('trust proxy', Number.isFinite(hops) && hops >= 0 ? hops : 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  // IP 收集 + 黑白名单过滤：放在最前面，命中黑名单的请求不进业务逻辑
  const ipSecurity = app.get(IpSecurityMiddleware);
  app.use((req, res, next) => {
    ipSecurity.use(req, res, next).catch(next);
  });

  app.useBodyParser('json', { limit: '2mb' }); // 模板正文可能较大
  app.useBodyParser('urlencoded', { limit: '2mb', extended: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 全局守卫：默认要求管理员登录，@Public() 的路由（发信、健康检查、登录）放行
  app.useGlobalGuards(new AdminGuard(app.get(Reflector), app.get(AdminService)));

  app.enableCors({
    origin: (configService.get<string>('CORS_ORIGINS') || 'https://wufeng98.cn')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: [],
  });

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const port = Number(configService.get<string>('PORT') || 5777);
  const host = configService.get<string>('HOST') || '127.0.0.1';
  await app.listen(port, host);

  console.log(
    `[email-server] http://${host}:${port}/api  env=${process.env.NODE_ENV || 'development'}`,
  );
}

bootstrap();
