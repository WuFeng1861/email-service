import { IsNotEmpty, IsString, IsInt, Min, IsIn, Matches } from 'class-validator';

export class CreateEmailKeyDto {
  @IsNotEmpty()
  @IsString()
  // 列表接口返回的是掩码（184***1861@163.com），前端若原样回传会把真实邮箱覆盖掉
  @Matches(/^(?!.*\*\*\*).*$/, { message: '用户名不能是掩码形式，请输入完整邮箱地址' })
  user: string;

  @IsNotEmpty()
  @IsString()
  pass: string;

  @IsNotEmpty()
  @IsString()
  app: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['QQ', '163', 'ali', 'gmail', 'outlook', 'other', "163Self"])
  emailCompany: string;

  @IsInt()
  @Min(1)
  limitCount: number;
}