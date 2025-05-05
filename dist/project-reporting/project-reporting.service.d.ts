import { OnModuleInit } from '@nestjs/common';
export declare class ProjectReportingService implements OnModuleInit {
    private readonly logger;
    private startTime;
    private reportingInterval;
    private reportingStatus;
    constructor();
    onModuleInit(): void;
    private startReporting;
    private reportStatus;
}
