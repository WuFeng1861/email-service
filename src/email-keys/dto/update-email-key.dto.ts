import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';

export class UpdateEmailKeyDto {
  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  pass?: string;

  @IsOptional()
  @IsString()
  app?: string;

  @IsOptional()
  @IsString()
  @IsIn(['QQ', '163', 'ali', 'gmail', 'outlook', 'other'])
  emailCompany?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limitCount?: number;
}