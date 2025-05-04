import { SystemService } from './system.service';
declare class RestartDto {
    password: string;
}
export declare class SystemController {
    private readonly systemService;
    constructor(systemService: SystemService);
    restart(restartDto: RestartDto): Promise<{
        message: string;
    }>;
}
export {};
