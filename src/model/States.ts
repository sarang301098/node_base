import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  OneToMany,
} from 'typeorm';

import { Counties } from './Counties';
import { ZipCodes } from './ZipCodes';

@Entity('states', { schema: 'public' })
export class States extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('double')
  salesTax!: number;

  @Column('integer', { default: () => 0 })
  totalCounties!: number;

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

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

  @OneToMany(() => Counties, (Counties) => Counties.state)
  counties!: Counties[];

  @OneToMany(() => ZipCodes, (zipCode) => zipCode.state)
  zipCodes!: ZipCodes[];
}
