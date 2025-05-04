"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailKeysModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const email_keys_controller_1 = require("./email-keys.controller");
const email_keys_service_1 = require("./email-keys.service");
const email_key_entity_1 = require("./entities/email-key.entity");
let EmailKeysModule = class EmailKeysModule {
};
exports.EmailKeysModule = EmailKeysModule;
exports.EmailKeysModule = EmailKeysModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([email_key_entity_1.EmailKey])],
        controllers: [email_keys_controller_1.EmailKeysController],
        providers: [email_keys_service_1.EmailKeysService],
        exports: [email_keys_service_1.EmailKeysService],
    })
], EmailKeysModule);
//# sourceMappingURL=email-keys.module.js.map