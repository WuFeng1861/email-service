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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailKeysController = void 0;
const common_1 = require("@nestjs/common");
const email_keys_service_1 = require("./email-keys.service");
const create_email_key_dto_1 = require("./dto/create-email-key.dto");
const update_email_key_dto_1 = require("./dto/update-email-key.dto");
let EmailKeysController = class EmailKeysController {
    constructor(emailKeysService) {
        this.emailKeysService = emailKeysService;
    }
    create(createEmailKeyDto) {
        return this.emailKeysService.create(createEmailKeyDto);
    }
    findAll() {
        return this.emailKeysService.findAll();
    }
    findOne(id) {
        return this.emailKeysService.findOne(id);
    }
    findByApp(app) {
        return this.emailKeysService.findByApp(app);
    }
    update(id, updateEmailKeyDto) {
        return this.emailKeysService.update(id, updateEmailKeyDto);
    }
    remove(id) {
        return this.emailKeysService.remove(id);
    }
};
exports.EmailKeysController = EmailKeysController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_email_key_dto_1.CreateEmailKeyDto]),
    __metadata("design:returntype", Promise)
], EmailKeysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailKeysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EmailKeysController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('app/:app'),
    __param(0, (0, common_1.Param)('app')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailKeysController.prototype, "findByApp", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_email_key_dto_1.UpdateEmailKeyDto]),
    __metadata("design:returntype", Promise)
], EmailKeysController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EmailKeysController.prototype, "remove", null);
exports.EmailKeysController = EmailKeysController = __decorate([
    (0, common_1.Controller)('email-keys'),
    __metadata("design:paramtypes", [email_keys_service_1.EmailKeysService])
], EmailKeysController);
//# sourceMappingURL=email-keys.controller.js.map