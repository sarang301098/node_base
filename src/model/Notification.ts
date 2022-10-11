import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  DeleteDateColumn,
} from 'typeorm';

@Entity('notification', { schema: 'public' })
export class Notification extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { nullable: true })
  fromId!: string | null;

  @Column('simple-array', { nullable: true })
  toIds!: Array<string | number> | null;

  @Column('varchar', { length: 255, nullable: true })
  title!: string | null;

  @Column('varchar', { length: 255, nullable: true })
  description!: string | null;

  @Column('varchar', { length: 255, nullable: true })
  adminMessage!: string | null;

  @Column('integer', { nullable: true })
  notificationType!: number | null;

  @Column('integer', { nullable: true })
  toUserType!: number | null; // 1 =superadmin 2=admin 3=vendor 4=driver 5=customer

  @Column('boolean', { default: () => 'false' })
  isAdmin!: boolean;

  @Column('simple-array', { nullable: true })
  deletedBy!: Array<string | number> | null;

  @Column('simple-array', { nullable: true })
  readedBy!: Array<string | number> | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;
}
