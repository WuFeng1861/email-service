"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueueModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const email_queue_controller_1 = require("./email-queue.controller");
const email_queue_service_1 = require("./email-queue.service");
const email_sender_service_1 = require("./email-sender.service");
const email_queue_entity_1 = require("./entities/email-queue.entity");
const email_keys_module_1 = require("../email-keys/email-keys.module");
const email_templates_module_1 = require("../email-templates/email-templates.module");
let EmailQueueModule = class EmailQueueModule {
};
exports.EmailQueueModule = EmailQueueModule;
exports.EmailQueueModule = EmailQueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([email_queue_entity_1.EmailQueue]),
            email_keys_module_1.EmailKeysModule,
            email_templates_module_1.EmailTemplatesModule,
        ],
        controllers: [email_queue_controller_1.EmailQueueController],
        providers: [email_queue_service_1.EmailQueueService, email_sender_service_1.EmailSenderService],
        exports: [email_queue_service_1.EmailQueueService],
    })
], EmailQueueModule);
//# sourceMappingURL=email-queue.module.js.map