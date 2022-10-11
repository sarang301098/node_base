import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Users } from './Users';
import { OrderDetails } from './OrderDetails';

@Entity('ratings', { schema: 'public' })
export class Ratings extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ nullable: true, type: 'integer' })
  rating!: number;

  @Column('varchar', { length: 255 })
  review!: string | null;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updateAt!: Date | null;

  @ManyToOne(() => OrderDetails, (orderDetails) => orderDetails.rating)
  @JoinColumn()
  orderDetail!: OrderDetails;

  @ManyToOne(() => Users, (user) => user.toRating)
  @JoinColumn({ name: 'to_user_id' })
  toUser!: Users;

  @ManyToOne(() => Users, (user) => user.fromRating)
  @JoinColumn({ name: 'from_user_id' })
  fromUser!: Users;
}
