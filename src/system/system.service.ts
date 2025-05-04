import { Injectable } from '@nestjs/common';

@Injectable()
export class SystemService {
  async restart(): Promise<void> {
    process.exit(999);
  }
}