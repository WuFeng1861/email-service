import { IsNotEmpty, IsString, IsEmail, IsObject, IsOptional, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipientDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class SendEmailDto {
  @IsNotEmpty()
  @IsString()
  app: string;

  @IsNotEmpty()
  @IsInt()
  templateId: number;

  @IsNotEmpty()
  @IsObject()
  templateData: Record<string, any>;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid recipient email address' })
  recipient: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  cc?: RecipientDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  bcc?: RecipientDto[];
}