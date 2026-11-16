import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { EmailKey } from './entities/email-key.entity';
import { CreateEmailKeyDto } from './dto/create-email-key.dto';
import { UpdateEmailKeyDto } from './dto/update-email-key.dto';
import { CacheService } from '../cache/cache.service';
import { resolveSmtpProfile } from '../common/smtp-profiles';

@Injectable()
export class EmailKeysService {
  private readonly logger = new Logger(EmailKeysService.name);
  private readonly CACHE_KEY = 'email_keys';
  private readonly CACHE_TTL = 300; // 5 分钟；原来 1 小时，改 key 后要等一小时才生效

  constructor(
    @InjectRepository(EmailKey)
    private emailKeyRepository: Repository<EmailKey>,
    private cacheService: CacheService,
  ) {}

  async create(createEmailKeyDto: CreateEmailKeyDto): Promise<EmailKey> {
    const emailKey = this.emailKeyRepository.create(createEmailKeyDto);
    const saved = await this.emailKeyRepository.save(emailKey);
    await this.refreshCache();
    // 返回对象不含 pass
    const { pass, ...safe } = saved as EmailKey & { pass?: string };
    return safe as EmailKey;
  }

  /** 列表/详情用：pass 因 select:false 不会带出，缓存里也不会有明文 */
  async findAll(): Promise<EmailKey[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY,
      async () => this.emailKeyRepository.find(),
      this.CACHE_TTL,
    );
  }

  async findOne(id: number): Promise<EmailKey> {
    const emailKeys = await this.findAll();
    const emailKey = emailKeys.find((key) => key.id === id);
    if (!emailKey) {
      throw new NotFoundException(`Email key with ID ${id} not found`);
    }
    // 返回副本，避免调用方修改污染缓存对象
    return { ...emailKey };
  }

  /**
   * 只有发信链路（EmailSenderService）才能调用。
   * 用 QueryBuilder 显式 addSelect，绕过 select:false。
   */
  async findSecret(id: number): Promise<EmailKey> {
    const key = await this.emailKeyRepository
      .createQueryBuilder('k')
      .addSelect('k.pass')
      .where('k.id = :id', { id })
      .getOne();

    if (!key) {
      throw new NotFoundException(`Email key with ID ${id} not found`);
    }
    return key;
  }

  /**
   * 保存前校验 SMTP 能否登录（只做 EHLO + AUTH，不发信）。
   * 编辑场景可以不传 pass：用库里已存的授权码验证，
   * 这样「只改每日限额」时也能顺带体检一次。
   */
  async verifyCredentials(input: {
    id?: number;
    user?: string;
    pass?: string;
    emailCompany?: string;
  }): Promise<{ ok: boolean; message?: string; host?: string }> {
    let user = input.user;
    let pass = input.pass;
    let emailCompany = input.emailCompany;

    // 掩码不是可用账号：编辑时前端可能把 184***1861@163.com 回传过来，
    // 视同「没提供」，回退到库里那份真实值，否则必然 535
    if (user && user.includes('***')) {
      user = undefined;
    }

    // 编辑时前端拿不到明文授权码，留空就用库里那份来验
    if (input.id && (!pass || !user || !emailCompany)) {
      try {
        const existing = await this.findSecret(input.id);
        user = user || existing.user;
        pass = pass || existing.pass;
        emailCompany = emailCompany || existing.emailCompany;
      } catch {
        return { ok: false, message: `凭证 ${input.id} 不存在` };
      }
    }

    if (!user || !pass) {
      return { ok: false, message: '用户名或授权码为空' };
    }

    const profile = resolveSmtpProfile(emailCompany);
    const host = `${profile.host}:${profile.port}`;
    if (profile.host === 'smtp.example.com') {
      return { ok: false, message: `未识别的邮件服务商：${emailCompany || '(空)'}`, host };
    }

    const transporter = nodemailer.createTransport({
      host: profile.host,
      port: profile.port,
      secure: profile.secure,
      requireTLS: profile.requireTLS,
      auth: { user, pass },
      // 这是同步保存请求，不能像后台发信那样等太久
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    try {
      await transporter.verify();
      this.logger.log(`凭证校验通过：${user} @ ${host}`);
      return { ok: true, host };
    } catch (e) {
      const raw = (e as Error)?.message || String(e);
      this.logger.warn(`凭证校验失败：${user} @ ${host} - ${raw}`);
      return { ok: false, message: this.explainSmtpError(raw), host };
    } finally {
      transporter.close();
    }
  }

  /** 把 nodemailer 的原始报错翻成人话 */
  private explainSmtpError(raw: string): string {
    if (/ERR\.LOGIN\.REQCODE/i.test(raw)) {
      return '163 要求使用客户端授权码，不能用邮箱登录密码';
    }
    if (/DOMAINEXPED/i.test(raw)) {
      return '发信域名已过期或未验证';
    }
    if (/authentication failed|invalid login|535/i.test(raw)) {
      return '用户名或授权码不正确';
    }
    if (/ETIMEDOUT|timeout|Greeting never received/i.test(raw)) {
      return '连接邮件服务器超时，请检查网络或服务商配置';
    }
    if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(raw)) {
      return '无法连接邮件服务器，请检查服务商与端口';
    }
    return raw;
  }

  async findOtherSameAppKeyById(id: number): Promise<EmailKey | null> {
    const emailKeys = await this.findAll();
    const emailKey = emailKeys.find((key) => key.id === id);
    if (!emailKey) return null;

    const candidates = emailKeys.filter(
      (key) => key.app === emailKey.app && key.id !== id && key.sentCount < key.limitCount,
    );
    return candidates.length ? { ...candidates[0] } : null;
  }

  async findByApp(app: string): Promise<EmailKey[]> {
    const emailKeys = await this.findAll();
    return emailKeys.filter((key) => key.app === app);
  }

  async update(id: number, updateEmailKeyDto: UpdateEmailKeyDto): Promise<EmailKey> {
    const emailKey = await this.findOne(id);

    // 掩码用户名（184***1861@163.com）不能写库，否则 SMTP 认证必然 535。
    // 视同「不修改该字段」，这样还没更新前端的旧客户端点保存也不会把数据写坏。
    const patch: UpdateEmailKeyDto = { ...updateEmailKeyDto };
    if (patch.user && patch.user.includes('***')) {
      delete patch.user;
    }

    // 注意：这里不能用 `?? null` 兜底，否则未传 pass 时会把已有授权码清空。
    // TypeORM 对 undefined 列会跳过写入。
    Object.assign(emailKey, patch);

    const updated = await this.emailKeyRepository.save(emailKey);
    await this.refreshCache();
    const { pass, ...safe } = updated as EmailKey & { pass?: string };
    return safe as EmailKey;
  }

  async remove(id: number): Promise<void> {
    const emailKey = await this.findOne(id);
    await this.emailKeyRepository.remove(emailKey);
    await this.refreshCache();
  }

  async refreshCache(): Promise<void> {
    const emailKeys = await this.emailKeyRepository.find();
    this.cacheService.set(this.CACHE_KEY, emailKeys, this.CACHE_TTL);
    this.logger.debug(`Email keys cache refreshed (${emailKeys.length} keys)`);
  }

  async incrementSentCount(id: number): Promise<EmailKey> {
    const emailKey = await this.findOne(id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(emailKey.lastResetDate);
    lastReset.setHours(0, 0, 0, 0);

    if (today.getTime() > lastReset.getTime()) {
      emailKey.sentCount = 1;
      emailKey.lastResetDate = today;
    } else {
      emailKey.sentCount += 1;
    }

    const updated = await this.emailKeyRepository.save(emailKey);
    await this.refreshCache();
    return updated;
  }

  async canSendEmail(id: number): Promise<boolean> {
    const emailKey = await this.findOne(id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(emailKey.lastResetDate);
    lastReset.setHours(0, 0, 0, 0);

    if (today.getTime() > lastReset.getTime()) {
      return true;
    }
    return emailKey.sentCount < emailKey.limitCount;
  }
}
