import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { ProductsDetails } from '../model/ProductDetails';

@EntityRepository(ProductsDetails)
export class ProductDetailsRepository extends BaseRepository<ProductsDetails> {}
