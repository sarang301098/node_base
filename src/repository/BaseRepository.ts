import { FindOneOptions, ObjectID, ObjectLiteral, Repository } from 'typeorm';

import { EntityNotFoundError } from '../error';

interface WithId {
  id: number | string;
}

export class BaseRepository<Entity extends ObjectLiteral> extends Repository<Entity> {
  async findByIdOrFail(
    id: string | number | Date | ObjectID,
    options?: FindOneOptions<Entity>,
  ): Promise<Entity> {
    return this.findOne(id, options).then((value) => {
      if (value === undefined) {
        return Promise.reject(new EntityNotFoundError(id, this.metadata.name));
      }
      return Promise.resolve(value);
    });
  }

  /**
   * Reload an entity from the database
   * @param entity
   *
   * @ref https://github.com/typeorm/typeorm/issues/2069#issuecomment-386348206
   */
  public reload(entity: Entity & WithId): Promise<Entity> {
    return this.findOneOrFail(entity.id);
  }
}
