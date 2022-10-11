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

import { Products } from './Products';
import { Categories } from './Categories';

@Entity('products_details', { schema: 'public' })
export class ProductsDetails extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('double', { default: () => 0 })
  indexPrice!: number | null;

  @Column('double', { default: () => 0 })
  discount!: number | null;

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
  @ManyToOne(() => Products, (product) => product.details)
  product!: Products;

  @RelationId((productsDetail: ProductsDetails) => productsDetail.product)
  productId!: string;

  @Index()
  @ManyToOne(() => Categories, (category) => category.productDetails)
  category!: Categories;

  @RelationId((productsDetail: ProductsDetails) => productsDetail.category)
  categoryId!: number;
}
