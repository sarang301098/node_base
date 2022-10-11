import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  Index,
  RelationId,
  OneToMany,
  ManyToOne,
} from 'typeorm';

import { States } from './States';
import { ZipCodes } from './ZipCodes';

@Entity('counties', { schema: 'public' })
export class Counties extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('double')
  salesTaxOne!: number | null;

  @Column('double')
  salesTaxTwo!: number | null;

  @Column('integer', { default: () => 0 })
  totalZipcodes!: number;

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

  @Index()
  @ManyToOne(() => States, (state) => state.counties)
  state!: States;

  @RelationId((county: Counties) => county.state)
  stateId!: number;

  @OneToMany(() => ZipCodes, (zipCode) => zipCode.county)
  zipCodes!: ZipCodes[];
}
