import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailKey } from './entities/email-key.entity';
import { CreateEmailKeyDto } from './dto/create-email-key.dto';
import { UpdateEmailKeyDto } from './dto/update-email-key.dto';
import { CacheService } from '../cache/cache.service';

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

    // 注意：这里不能用 `?? null` 兜底，否则未传 pass 时会把已有授权码清空。
    // TypeORM 对 undefined 列会跳过写入。
    Object.assign(emailKey, updateEmailKeyDto);

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
