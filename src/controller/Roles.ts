import {
  getCustomRepository,
  ILike,
  FindConditions,
  getManager,
  getRepository,
  DeepPartial,
  Not,
} from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { BadRequestError } from '../error';

import { Roles } from '../model/Roles';
import { Modules } from '../model/Modules';
import { Permissions } from '../model/Permissions';
import { RolesRepository } from '../repository/Roles';

export const getRoleValidation = {
  query: Joi.object({
    search: Joi.string().max(50).default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(20),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage },
  } = req;

  const rolesRepository = getCustomRepository(RolesRepository);
  let where: FindConditions<Roles> = {};

  if (search && search !== null) {
    where = { ...where, name: ILike(`%${search}%`) };
  }

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const [roles, count] = await rolesRepository.findAndCount({
    where,
    take: limit,
    skip: offset,
  });

  res.status(200).json({ count, roles });
};

export const getByIdRoleValidation = {
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const getByIdRole = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const query = getManager()
    .createQueryBuilder(Roles, 'role')
    .where('role.id = :id', { id })
    .leftJoin('role.permissions', 'permissions')
    .addSelect([
      'permissions.id',
      'permissions.module',
      'permissions.all',
      'permissions.index',
      'permissions.add',
      'permissions.edit',
      'permissions.delete',
      'permissions.view',
    ])
    .leftJoin('permissions.module', 'module')
    .addSelect(['module.id', 'module.name', 'module.parentId']);

  const role = await query.getOne();
  res.status(200).json({ role });
};

const namePattern = '^[A-za-z]';
export const createRoleValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    isActive: Joi.boolean().required(),
    permissions: Joi.object()
      .pattern(
        Joi.string(),
        Joi.object().pattern(
          Joi.string(),
          Joi.alternatives(Joi.number().min(0).max(1).allow(0, 1), Joi.boolean()),
        ),
      )
      .allow(null)
      .default(null),
  }),
};
export const createRole = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, isActive, permissions },
  } = req;

  const permissionsRepo = getRepository(Permissions);
  const roleRepo = getCustomRepository(RolesRepository);

  const existingRole = await roleRepo.findOne({ where: { name } });
  if (existingRole) {
    throw new BadRequestError('Role is already available', 'ROLE_ALREADY_EXIST');
  }

  let newRole = roleRepo.create({
    name,
    isActive,
    permissions: [],
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  newRole = await roleRepo.save(newRole);

  const newPermissions: Array<Permissions> = [];
  for (const key of Object.keys(permissions)) {
    (newPermissions || []).push(
      permissionsRepo.create({
        role: newRole,
        createdBy: user?.id,
        updatedBy: user?.id,
        add: permissions[key]?.add,
        all: permissions[key]?.all,
        view: permissions[key]?.view,
        edit: permissions[key]?.edit,
        index: permissions[key]?.index,
        delete: permissions[key]?.delete,
        module: await getManager().getRepository(Modules).findOne(key),
      }),
    );
  }
  await permissionsRepo.save(newPermissions);

  const role = await roleRepo.getByRelatioins(newRole, ['permissions']);
  res.status(200).json({ role });
};

export const updateRoleValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).optional(),
    isActive: Joi.boolean().optional(),
    permissions: Joi.object()
      .pattern(
        Joi.string(),
        Joi.object().pattern(Joi.string(), Joi.alternatives(Joi.number().integer(), Joi.boolean())),
      )
      .allow(null)
      .default(null),
  }),
};
export const updateRole = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, isActive, permissions },
    params: { id },
  } = req;

  const roleRepo = getRepository(Roles);
  const permissionsRepo = getRepository(Permissions);
  const modulesRepo = getRepository(Modules);

  const uniqRole = await roleRepo.findOne({
    where: { id: Not(id), name },
  });
  if (uniqRole) {
    throw new BadRequestError(`Role with name: ${name} already exist`, 'Role_ALREADY_EXIST');
  }

  const role = await roleRepo.findOneOrFail(id);
  if (!role) {
    throw new BadRequestError('Role is not available', 'ROLE_NOT_AVAILABLE');
  }

  if (name) role.name = name;
  if (isActive !== undefined) role.isActive = isActive;
  role.updatedBy = user?.id;

  await roleRepo.save(role);

  if (permissions && (Object.keys(permissions) || []).length) {
    const permissionsToSave: Array<Permissions> = [];
    const permissionsToUpdate: Array<DeepPartial<Permissions>> = [];
    for (const key of Object.keys(permissions)) {
      if (permissions[key] && permissions[key]?.permissionId) {
        permissionsToUpdate.push({
          updatedBy: user?.id,
          all: permissions[key]?.all,
          add: permissions[key]?.add,
          edit: permissions[key]?.edit,
          view: permissions[key]?.view,
          index: permissions[key]?.index,
          delete: permissions[key]?.delete,
          id: permissions[key]?.permissionId,
          // TODO: if changes in the module api params will be changes
          // module:
          //   permissions[key]?.moduleId && (await modulesRepo.findOne(permissions[key]?.moduleId)),
        });
      } else {
        permissionsToSave.push(
          permissionsRepo.create({
            role,
            createdBy: user?.id,
            updatedBy: user?.id,
            all: permissions[key]?.all,
            add: permissions[key]?.add,
            edit: permissions[key]?.edit,
            view: permissions[key]?.view,
            index: permissions[key]?.index,
            delete: permissions[key]?.delete,
            module: await modulesRepo.findOne(key),
          }),
        );
      }
    }

    await permissionsRepo.save([...permissionsToSave, ...permissionsToUpdate]);
  }
  res.sendStatus(204);
};

export const deleteRoleValidation = {
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const removeRole = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(
      Permissions,
      { role: await getManager().getRepository(Roles).findOne(id) },
      { updatedBy: userId },
    );
    await em.softDelete(Permissions, { role: await getManager().getRepository(Roles).findOne(id) });
    await em.update(Roles, { id }, { updatedBy: userId });
    await em.softDelete(Roles, id);
  });

  res.sendStatus(204);
};

export const getRoleOptions = () => async (req: Request, res: Response): Promise<void> => {
  const rolesRepository = getCustomRepository(RolesRepository);

  const [roles, count] = await rolesRepository.findAndCount({
    where: { isActive: true },
    select: ['id', 'name'],
  });

  res.status(200).json({ count, roles });
};
