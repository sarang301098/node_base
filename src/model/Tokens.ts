import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Users } from './Users';

@Entity('tokens', { schema: 'public' })
export class Tokens extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('varchar', { length: 255, nullable: true })
  deviceId!: string;

  @Column('varchar', { length: 255, nullable: true })
  deviceType!: string;

  @Column('longtext', { nullable: true })
  accessToken!: string;

  @Column('longtext', { nullable: true })
  refreshToken!: string;

  @Column('timestamp', { nullable: true })
  lastLogin!: Date;

  @Column('integer', { nullable: true, default: () => '0' })
  loginCount!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date;

  @OneToOne(() => Users, (user) => user.token)
  @JoinColumn()
  user!: Users;
}
