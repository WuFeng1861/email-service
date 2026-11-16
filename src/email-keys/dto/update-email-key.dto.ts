import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';

export class UpdateEmailKeyDto {
  @IsOptional()
  @IsString()
  // 掩码（184***1861@163.com）由 service.update 直接忽略，不在这里报 400，
  // 这样还没更新前端的旧客户端点保存也不会失败
  user?: string;

  @IsOptional()
  @IsString()
  pass?: string;

  @IsOptional()
  @IsString()
  app?: string;

  @IsOptional()
  @IsString()
  @IsIn(['QQ', '163', 'ali', 'gmail', 'outlook', 'other', '163Self'])
  emailCompany?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limitCount?: number;
}