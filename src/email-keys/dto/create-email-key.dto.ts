import { IsNotEmpty, IsString, IsInt, Min, IsIn } from 'class-validator';

export class CreateEmailKeyDto {
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  pass: string;

  @IsNotEmpty()
  @IsString()
  app: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['QQ', '163', 'ali', 'gmail', 'outlook', 'other'])
  emailCompany: string;

  @IsInt()
  @Min(1)
  limitCount: number;
}