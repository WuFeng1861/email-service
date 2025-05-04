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
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(EmailKey)
    private emailKeyRepository: Repository<EmailKey>,
    private cacheService: CacheService,
  ) {
    // Initialize cache when service starts
    this.refreshCache();
  }

  async create(createEmailKeyDto: CreateEmailKeyDto): Promise<EmailKey> {
    const emailKey = this.emailKeyRepository.create(createEmailKeyDto);
    const saved = await this.emailKeyRepository.save(emailKey);
    await this.refreshCache();
    return saved;
  }

  async findAll(): Promise<EmailKey[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY,
      async () => {
        this.logger.log('Cache miss for email keys, fetching from database');
        return this.emailKeyRepository.find();
      },
      this.CACHE_TTL,
    );
  }

  async findOne(id: number): Promise<EmailKey> {
    const emailKeys = await this.findAll();
    const emailKey = emailKeys.find(key => key.id === id);
    
    if (!emailKey) {
      throw new NotFoundException(`Email key with ID ${id} not found`);
    }
    
    return emailKey;
  }

  async findByApp(app: string): Promise<EmailKey[]> {
    const emailKeys = await this.findAll();
    return emailKeys.filter(key => key.app === app);
  }

  async update(id: number, updateEmailKeyDto: UpdateEmailKeyDto): Promise<EmailKey> {
    const emailKey = await this.findOne(id);
    
    // Update fields
    Object.assign(emailKey, updateEmailKeyDto);
    
    const updated = await this.emailKeyRepository.save(emailKey);
    await this.refreshCache();
    return updated;
  }

  async remove(id: number): Promise<void> {
    const emailKey = await this.findOne(id);
    await this.emailKeyRepository.remove(emailKey);
    await this.refreshCache();
  }

  async refreshCache(): Promise<void> {
    const emailKeys = await this.emailKeyRepository.find();
    this.cacheService.set(this.CACHE_KEY, emailKeys, this.CACHE_TTL);
    this.logger.log('Email keys cache refreshed');
  }

  async incrementSentCount(id: number): Promise<EmailKey> {
    const emailKey = await this.findOne(id);
    
    // Check if we need to reset the counter (new day)
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
    
    // Check if we need to reset the counter (new day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastReset = new Date(emailKey.lastResetDate);
    lastReset.setHours(0, 0, 0, 0);
    
    if (today.getTime() > lastReset.getTime()) {
      // New day, reset counter
      return true;
    }
    
    // Check if we have reached the limit
    return emailKey.sentCount < emailKey.limitCount;
  }
}