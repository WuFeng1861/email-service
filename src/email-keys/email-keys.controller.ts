import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { EmailKeysService } from './email-keys.service';
import { CreateEmailKeyDto } from './dto/create-email-key.dto';
import { UpdateEmailKeyDto } from './dto/update-email-key.dto';
import { EmailKey } from './entities/email-key.entity';

@Controller('email-keys')
export class EmailKeysController {
  constructor(private readonly emailKeysService: EmailKeysService) {}

  @Post()
  create(@Body() createEmailKeyDto: CreateEmailKeyDto): Promise<EmailKey> {
    return this.emailKeysService.create(createEmailKeyDto);
  }

  @Get()
  findAll(): Promise<EmailKey[]> {
    return this.emailKeysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EmailKey> {
    return this.emailKeysService.findOne(id);
  }

  @Get('app/:app')
  findByApp(@Param('app') app: string): Promise<EmailKey[]> {
    return this.emailKeysService.findByApp(app);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmailKeyDto: UpdateEmailKeyDto,
  ): Promise<EmailKey> {
    return this.emailKeysService.update(id, updateEmailKeyDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.emailKeysService.remove(id);
  }
}