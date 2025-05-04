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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailKey = void 0;
const typeorm_1 = require("typeorm");
let EmailKey = class EmailKey {
};
exports.EmailKey = EmailKey;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], EmailKey.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], EmailKey.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], EmailKey.prototype, "pass", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], EmailKey.prototype, "app", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email_company', nullable: false }),
    __metadata("design:type", String)
], EmailKey.prototype, "emailCompany", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'limit_count', nullable: false, default: 100 }),
    __metadata("design:type", Number)
], EmailKey.prototype, "limitCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_count', default: 0 }),
    __metadata("design:type", Number)
], EmailKey.prototype, "sentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'last_reset_date',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    }),
    __metadata("design:type", Date)
], EmailKey.prototype, "lastResetDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], EmailKey.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], EmailKey.prototype, "updatedAt", void 0);
exports.EmailKey = EmailKey = __decorate([
    (0, typeorm_1.Entity)('email_keys')
], EmailKey);
//# sourceMappingURL=email-key.entity.js.map