import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  OneToMany,
  Generated,
} from 'typeorm';

import { Permissions } from './Permissions';
import { SubAdminDetails } from './SubAdminDetails';

@Entity('roles', { schema: 'public' })
export class Roles extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  @Generated('uuid')
  uuid!: string;

  @Column('varchar', { length: 255 })
  name!: string | null;

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

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @OneToMany(() => Permissions, (permissions) => permissions.role)
  permissions!: Permissions[];

  @OneToMany(() => SubAdminDetails, (subAdmin) => subAdmin.role)
  subAdmins!: SubAdminDetails[];
}
