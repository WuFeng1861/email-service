"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const email_templates_controller_1 = require("./email-templates.controller");
const email_templates_service_1 = require("./email-templates.service");
const email_template_entity_1 = require("./entities/email-template.entity");
let EmailTemplatesModule = class EmailTemplatesModule {
};
exports.EmailTemplatesModule = EmailTemplatesModule;
exports.EmailTemplatesModule = EmailTemplatesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([email_template_entity_1.EmailTemplate])],
        controllers: [email_templates_controller_1.EmailTemplatesController],
        providers: [email_templates_service_1.EmailTemplatesService],
        exports: [email_templates_service_1.EmailTemplatesService],
    })
], EmailTemplatesModule);
//# sourceMappingURL=email-templates.module.js.map