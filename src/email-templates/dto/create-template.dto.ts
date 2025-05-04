import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['html', 'text'])
  type: string;
}