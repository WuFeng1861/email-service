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
exports.SystemController = void 0;
const common_1 = require("@nestjs/common");
const system_service_1 = require("./system.service");
class RestartDto {
}
let SystemController = class SystemController {
    constructor(systemService) {
        this.systemService = systemService;
    }
    async restart(restartDto) {
        if (restartDto.password !== 'wufeng1998-email') {
            throw new common_1.HttpException('Invalid password', common_1.HttpStatus.UNAUTHORIZED);
        }
        await this.systemService.restart();
        return { message: 'System is shutting down' };
    }
};
exports.SystemController = SystemController;
__decorate([
    (0, common_1.Post)('restart-p'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RestartDto]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "restart", null);
exports.SystemController = SystemController = __decorate([
    (0, common_1.Controller)('system'),
    __metadata("design:paramtypes", [system_service_1.SystemService])
], SystemController);
//# sourceMappingURL=system.controller.js.map