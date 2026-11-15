import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('email_keys')
export class EmailKey {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  user: string;

  /**
   * SMTP 授权码。
   * select:false → 默认查询不带出，只有 email-keys.service.findSecret() 显式 addSelect 才能拿到。
   * @Exclude → 万一某条路径把实体直接序列化，也不会出现在 JSON 里。
   */
  @Column({ nullable: false, select: false })
  @Exclude()
  pass: string;

  @Column({ nullable: false })
  app: string;

  @Column({ name: 'email_company', nullable: false })
  emailCompany: string;

  @Column({ name: 'limit_count', nullable: false, default: 100 })
  limitCount: number;

  @Column({ name: 'sent_count', default: 0 })
  sentCount: number;

  // SQLite 没有 timestamp 类型，统一用 datetime（TEXT 存储，TypeORM 自动转 Date）
  @Column({
    name: 'last_reset_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastResetDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
