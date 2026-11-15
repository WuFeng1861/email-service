import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('email_queue')
// 发送循环每 5 秒扫一次，没索引时是全表扫（审计 P2-8）
@Index('idx_status_next_attempt', ['status', 'nextAttemptAt'])
export class EmailQueue {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  app: string;

  @Column({ nullable: false })
  recipient: string;

  @Column({ nullable: true })
  cc: string;

  @Column({ nullable: true })
  bcc: string;

  @Column({ nullable: false })
  subject: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ default: 'html' })
  contentType: string;

  @Column({ nullable: false })
  templateId: number;

  // simple-json：MySQL 的 json 列在 SQLite 下不被支持，读写时由 TypeORM 自行序列化
  @Column({ type: 'simple-json', nullable: true })
  templateData: Record<string, any>;

  @Column({ nullable: false })
  emailKeyId: number;

  // SQLite 没有 enum：用 varchar + 应用层枚举约束
  @Column({
    type: 'varchar',
    length: 20,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ default: 0 })
  retryCount: number;

  /** 下次可尝试时间。null 表示立即可发（兼容存量数据） */
  @Column({ name: 'next_attempt_at', type: 'datetime', nullable: true })
  nextAttemptAt: Date | null;

  /** 最大重试次数，超过即置 FAILED，避免死循环 */
  @Column({ name: 'max_retry', default: 5 })
  maxRetry: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
