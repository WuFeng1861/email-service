"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProjectReportingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectReportingService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const os = require("os");
let ProjectReportingService = ProjectReportingService_1 = class ProjectReportingService {
    constructor() {
        this.logger = new common_1.Logger(ProjectReportingService_1.name);
        this.reportingStatus = false;
        this.startTime = new Date();
    }
    onModuleInit() {
        this.startReporting();
    }
    startReporting() {
        this.reportStatus();
        this.reportingInterval = setInterval(() => {
            if (this.reportingStatus) {
                return;
            }
            this.reportStatus();
        }, 60 * 1000);
    }
    async reportStatus() {
        this.reportingStatus = true;
        try {
            const networkInterfaces = os.networkInterfaces();
            let serverIp = process.env.SERVER_IP || 'localhost';
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
            const response = await axios_1.default.post('https://wufeng98.cn/projectManagerApi/projects', data);
            console.log(response.data);
            if (response.data.success) {
                this.logger.log('Project status reported successfully');
            }
            else {
                this.logger.warn('Project status report failed:', response.data.message);
            }
        }
        catch (error) {
            this.logger.error('Failed to report project status:', error.message);
        }
        finally {
            this.reportingStatus = false;
        }
    }
};
exports.ProjectReportingService = ProjectReportingService;
exports.ProjectReportingService = ProjectReportingService = ProjectReportingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ProjectReportingService);
//# sourceMappingURL=project-reporting.service.js.map