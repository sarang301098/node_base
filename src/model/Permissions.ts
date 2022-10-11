import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  Index,
  RelationId,
} from 'typeorm';

import { Modules } from './Modules';
import { Roles } from './Roles';

@Entity('permissions', { schema: 'public' })
export class Permissions extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('boolean', { default: () => 'false' })
  all!: boolean | null;

  @Column('boolean', { default: () => 'false' })
  index!: boolean | null;

  @Column('boolean', { default: () => 'false' })
  add!: boolean | null;

  @Column('boolean', { default: () => 'false' })
  edit!: boolean | null;

  @Column('boolean', { default: () => 'false' })
  delete!: boolean | null;

  @Column('boolean', { default: () => 'false' })
  view!: boolean | null;

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

  @Index()
  @ManyToOne(() => Roles, (role) => role.permissions)
  role!: Roles | null;

  @RelationId((permission: Permissions) => permission.role)
  roleId!: number | null;

  @Index()
  @ManyToOne(() => Modules, (module) => module.permissions)
  module!: Modules;

  @RelationId((permissions: Permissions) => permissions.module)
  moduleId!: number;
}
