import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
} from 'typeorm';
import moment, { Moment } from 'moment';

@Entity('government_holidays', { schema: 'public' })
export class GovernmentHolidays extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('longtext', { nullable: true })
  description!: string | null;

  @Column('simple-array', { nullable: true })
  vendorIds!: string[] | null;

  @Column('timestamp', { nullable: true })
  date!: Date;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  getDayByFormat = (format: string): Moment => moment(this.date, format);
}
