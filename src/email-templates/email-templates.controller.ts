import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { EmailTemplate } from './entities/email-template.entity';

@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly templatesService: EmailTemplatesService) {}

  @Post()
  create(@Body() createTemplateDto: CreateTemplateDto): Promise<EmailTemplate> {
    return this.templatesService.create(createTemplateDto);
  }

  @Get()
  findAll(): Promise<EmailTemplate[]> {
    return this.templatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EmailTemplate> {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ): Promise<EmailTemplate> {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.templatesService.remove(id);
  }
}