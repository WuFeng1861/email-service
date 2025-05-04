import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SystemService } from './system.service';

class RestartDto {
  password: string;
}

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post('restart-p')
  async restart(@Body() restartDto: RestartDto) {
    if (restartDto.password !== 'wufeng1998-email') {
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }
    
    await this.systemService.restart();
    return { message: 'System is shutting down' };
  }
}