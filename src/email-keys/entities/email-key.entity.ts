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

  @Column({ name: 'last_reset_date', type: 'date', default: () => 'CURRENT_DATE' })
  lastResetDate: Date;
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
