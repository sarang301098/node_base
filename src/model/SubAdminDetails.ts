import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
  Index,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { Users } from './Users';
import { Roles } from './Roles';

@Entity('sub_admin_details', { schema: 'public' })
export class SubAdminDetails extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('integer', { nullable: true })
  pageSize!: number | null;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number;

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

  @OneToOne(() => Users, (users) => users.subAdmin)
  @JoinColumn()
  user!: Users;

  @Index()
  @ManyToOne(() => Roles, (role) => role.subAdmins)
  role!: Roles;

  @RelationId((subAdmins: SubAdminDetails) => subAdmins.role)
  roleId!: number;
}
