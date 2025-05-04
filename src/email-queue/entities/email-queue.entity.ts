import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('email_queue')
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
  contentType: string; // 'html' or 'text'

  @Column({ nullable: false })
  templateId: number;

  @Column({ type: 'json', nullable: true })
  templateData: Record<string, any>;

  @Column({ nullable: false })
  emailKeyId: number;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}