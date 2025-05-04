"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const email_keys_module_1 = require("./email-keys/email-keys.module");
const email_templates_module_1 = require("./email-templates/email-templates.module");
const email_queue_module_1 = require("./email-queue/email-queue.module");
const statistics_module_1 = require("./statistics/statistics.module");
const cache_module_1 = require("./cache/cache.module");
const system_module_1 = require("./system/system.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 3306),
                    username: configService.get('DB_USERNAME', 'root'),
                    password: configService.get('DB_PASSWORD', '666666'),
                    database: configService.get('DB_DATABASE', 'email_service'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: true,
                }),
            }),
            cache_module_1.CacheModule,
            email_keys_module_1.EmailKeysModule,
            email_templates_module_1.EmailTemplatesModule,
            email_queue_module_1.EmailQueueModule,
            statistics_module_1.StatisticsModule,
            system_module_1.SystemModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map