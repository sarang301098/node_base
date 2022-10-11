import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  Index,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { Users } from './Users';

@Entity('documents', { schema: 'public' })
export class Documents extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255, nullable: true })
  documentUrl!: string | null;

  @Column('integer', { default: () => '0' }) // 0 - N/A, 1 - Business Certi, 2 - Driving License
  documentType!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @Index()
  @ManyToOne(() => Users, (user) => user.documents)
  user!: Users;

  @RelationId((document: Documents) => document.user)
  userId!: number;
}
