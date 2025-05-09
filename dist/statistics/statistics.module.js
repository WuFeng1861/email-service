"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsModule = void 0;
const common_1 = require("@nestjs/common");
const statistics_controller_1 = require("./statistics.controller");
const statistics_service_1 = require("./statistics.service");
const email_queue_module_1 = require("../email-queue/email-queue.module");
const email_keys_module_1 = require("../email-keys/email-keys.module");
const email_templates_module_1 = require("../email-templates/email-templates.module");
let StatisticsModule = class StatisticsModule {
};
exports.StatisticsModule = StatisticsModule;
exports.StatisticsModule = StatisticsModule = __decorate([
    (0, common_1.Module)({
        imports: [email_queue_module_1.EmailQueueModule, email_keys_module_1.EmailKeysModule, email_templates_module_1.EmailTemplatesModule],
        controllers: [statistics_controller_1.StatisticsController],
        providers: [statistics_service_1.StatisticsService],
    })
], StatisticsModule);
//# sourceMappingURL=statistics.module.js.map