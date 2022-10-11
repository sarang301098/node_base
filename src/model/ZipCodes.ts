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
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { Cart } from './Cart';
import { States } from './States';
import { Counties } from './Counties';
import { UserAddresses } from './UserAddress';
import { OrderDetails } from './OrderDetails';

@Entity('zipcodes', { schema: 'public' })
export class ZipCodes extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255 })
  areaName!: string | null;

  @Column('integer', { nullable: false })
  zipcode!: string;

  @Column('double')
  salesTax!: number;

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
  @ManyToOne(() => Counties, (county) => county.zipCodes)
  county!: Counties;

  @RelationId((zipcode: ZipCodes) => zipcode.county)
  countyId!: number;

  @Index()
  @ManyToOne(() => States, (state) => state.zipCodes)
  state!: States;

  @RelationId((zipcode: ZipCodes) => zipcode.state)
  stateId!: number;

  @OneToMany(() => UserAddresses, (address) => address.zipCode)
  addresses!: UserAddresses[];

  @OneToMany(() => Cart, (cart) => cart.zipcode)
  cart!: Cart[];

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.zipcode)
  orderDetails!: OrderDetails[];
}
