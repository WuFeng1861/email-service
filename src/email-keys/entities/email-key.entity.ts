import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('email_keys')
export class EmailKey {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  user: string;

  @Column({ nullable: false })
  pass: string;

  @Column({ nullable: false })
  app: string;

  @Column({ name: 'email_company', nullable: false })
  emailCompany: string;

  @Column({ name: 'limit_count', nullable: false, default: 100 })
  limitCount: number;

  @Column({ name: 'sent_count', default: 0 })
  sentCount: number;
  
  // 修改CURRENT_DATE为CURRENT_TIMESTAMP并转换为日期
  @Column({
    name: 'last_reset_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  lastResetDate: Date;
  
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
