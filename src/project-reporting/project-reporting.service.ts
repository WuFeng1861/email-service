import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as os from 'os';

@Injectable()
export class ProjectReportingService implements OnModuleInit {
  private readonly logger = new Logger(ProjectReportingService.name);
  private startTime: Date;
  private reportingInterval: NodeJS.Timeout;
  private reportingStatus: boolean = false;

  constructor() {
    this.startTime = new Date();
  }

  onModuleInit() {
    this.startReporting();
  }

  private startReporting() {
    // Report immediately on startup
    this.reportStatus();

    // Then report every minute
    this.reportingInterval = setInterval(() => {
      if (this.reportingStatus) {
        return;
      }
      this.reportStatus();
    }, 60 * 1000); // 60000ms = 1 minute
  }

  private async reportStatus() {
    this.reportingStatus = true;
    try {
      const networkInterfaces = os.networkInterfaces();
      let serverIp = process.env.SERVER_IP || 'localhost';

      // Try to find a non-internal IPv4 address
      Object.values(networkInterfaces).forEach((interfaces) => {
        interfaces.forEach((iface) => {
          if (!iface.internal && iface.family === 'IPv4') {
            serverIp = iface.address;
          }
        });
      });

      const runtimeSeconds = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

      const data = {
        serviceName: 'email-service',
        serverIp,
        servicePort: process.env.PORT || 3000,
        serviceNotes: 'Email sending service',
        serviceRuntime: runtimeSeconds,
        serviceDescription: 'NestJS Email Service with MySQL',
        lastRestartTime: this.startTime.toISOString(),
        projectPassword: 'wufeng1998-email'
      };

      const response = await axios.post('https://wufeng98.cn/projectManagerApi/projects', data);
      console.log(response.data);
      if (response.data.success) {
        this.logger.log('Project status reported successfully');
      } else {
        this.logger.warn('Project status report failed:', response.data.message);
      }
    } catch (error) {
      this.logger.error('Failed to report project status:', error.message);
    } finally {
      this.reportingStatus = false;
    }
  }
}
