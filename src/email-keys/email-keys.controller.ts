import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { EmailKeysService } from './email-keys.service';
import { CreateEmailKeyDto } from './dto/create-email-key.dto';
import { UpdateEmailKeyDto } from './dto/update-email-key.dto';
import { EmailKey } from './entities/email-key.entity';

/** 18460391861@163.com → 184****1861@163.com */
function maskEmail(user: string): string {
  if (!user || !user.includes('@')) return '***';
  const [name, domain] = user.split('@');
  if (name.length <= 4) return `***@${domain}`;
  return `${name.slice(0, 3)}***${name.slice(-4)}@${domain}`;
}

function toSafeKey(key: EmailKey) {
  return {
    id: key.id,
    user: maskEmail(key.user),
    app: key.app,
    emailCompany: key.emailCompany,
    limitCount: key.limitCount,
    sentCount: key.sentCount,
    lastResetDate: key.lastResetDate,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
    // 注意：没有 pass 字段
  };
}

@Controller('email-keys')
export class EmailKeysController {
  constructor(private readonly emailKeysService: EmailKeysService) {}

  @Post()
  async create(@Body() createEmailKeyDto: CreateEmailKeyDto) {
    return toSafeKey(await this.emailKeysService.create(createEmailKeyDto));
  }

  // 审计复现的正是这个接口：无鉴权 + 明文授权码
  @Get()
  async findAll() {
    const keys = await this.emailKeysService.findAll();
    return keys.map(toSafeKey);
  }

  // 必须放在 :id 之前，否则 'app' 会被 ParseIntPipe 拦成 400
  @Get('app/:app')
  async findByApp(@Param('app') app: string) {
    const keys = await this.emailKeysService.findByApp(app);
    return keys.map(toSafeKey);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return toSafeKey(await this.emailKeysService.findOne(id));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmailKeyDto: UpdateEmailKeyDto,
  ) {
    return toSafeKey(await this.emailKeysService.update(id, updateEmailKeyDto));
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.emailKeysService.remove(id);
  }
}
