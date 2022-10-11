import { getManager, getRepository, getCustomRepository, FindConditions } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';
import { AppsettingsRepository } from '../repository/AppSettings';

import { Appsettings } from '../model/Appsettings';

/**
 * Title: App setting List API;
 * Created By: Sarang Patel;
 * steps:
 *    1) fetch list of app settings and send it as a reponse.
 */
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const appSettingsRepository = getCustomRepository(AppsettingsRepository);

  const [settings, count] = await appSettingsRepository.findAndCount({
    select: ['id', 'orderType', 'key', 'label', 'value', 'type', 'isActive'],
  });

  res.status(200).json({ count, settings });
};

export const createAppSettingsValidation = {
  body: Joi.object({
    key: Joi.string().max(255).allow(null),
    label: Joi.string().max(255).required(),
    value: Joi.number().required(),
    type: Joi.number().required(),
    orderType: Joi.number().required(),
    isActive: Joi.boolean().required(),
  }),
};
/**
 * Title: Create Accessory API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Check if the appsettings is available or not .
 *    2) If it isn't create new and then save it in the Database.
 *    3) Send response that created appsetting with status code 201.
 */
export const createAppSettings = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { key, label, value, type, orderType, isActive },
  } = req;

  const appSettingsRepository = getRepository(Appsettings);
  let where: FindConditions<Appsettings> = { orderType, type, label };

  if (key && key !== '') {
    where = { ...where, key };
  }

  const existingSetting = await appSettingsRepository.findOne({
    where,
  });

  if (existingSetting) {
    throw new BadRequestError('Setting For the App already exist', 'APP_SETTING_ALREADY_EXIST');
  }

  let appSetting = appSettingsRepository.create({
    key,
    label,
    value,
    type,
    orderType,
    isActive,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  appSetting = await appSettingsRepository.save(appSetting);

  res.status(201).json(appSetting);
};

export const updateAppSettingManyValidation = {
  body: Joi.object({
    appSettings: Joi.array().items(
      Joi.object({
        id: Joi.number().required(),
        isActive: Joi.boolean().required(),
        value: Joi.number().required(),
      }),
    ),
  }),
};
/**
 * Title: Update App setting Many API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Handle updated app setting variable which is retrive from the request.
 *    2) After that create/update the app setting accordingly using repo.save().
 *    3) Send status of 204.
 */
export const updateAppSettingsMany = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { appSettings },
  } = req;

  const appSettingsRepository = getCustomRepository(AppsettingsRepository);

  // TODO: Optimize Code.
  // if (appSettings && appSettings.length) {
  //   (appSettings || []).forEach(async (appSetting: updatedAppSetting) => {
  //     await appSettingsRepository.update(appSetting?.id, { ...appSetting });
  //   });
  // }

  for (let index = 0; index < appSettings.length; index++) {
    if (!appSettings[index]?.id) {
      appSettings[index] = {
        ...appSettings[index],
      };
    }
  }
  await appSettingsRepository.save(appSettings);

  res.sendStatus(204);
};

export const updateAppSettingValidation = {
  body: Joi.object({
    key: Joi.string().max(255).required(),
    label: Joi.string().max(255).required(),
    value: Joi.number().required(),
    type: Joi.number().required(),
    orderType: Joi.number().required(),
    isActive: Joi.boolean().required(),
  }),
};
/**
 * Title: Update Appsetting API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Retrive all request/updated appsetting data.
 *    2) Then check that appsetting is available or not.
 *    3) If it is then check that request data is valid and make update object of valid data.
 *    4) If all updated successfully then send update status 204 as a response.
 */
export const updateAppSettings = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { key, label, value, type, orderType, isActive },
    params: { id },
  } = req;

  const appSettingsRepository = getCustomRepository(AppsettingsRepository);

  const appSettingById = await appSettingsRepository.findByIdOrFail(id);

  if (key) appSettingById.key = key as string;
  if (label) appSettingById.label = label as string;
  if (value) appSettingById.value = value as number;
  if (type) appSettingById.type = type as number;
  if (orderType) appSettingById.orderType = orderType as number;
  if (isActive !== undefined) appSettingById.isActive = orderType as boolean;
  appSettingById.updatedBy = user?.id;

  await appSettingsRepository.save(appSettingById);

  res.sendStatus(204);
};

export const deleteAppSettingManyValidation = {
  body: Joi.object({
    appSettings: Joi.array().items(Joi.number().integer().required()).allow(null),
  }),
};
/**
 * Title: Delete Accessory API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Soft delete appsettings of given id's array with Transactions.
 *    2) If all deleted successfully then send delete status 204 as a response.
 */
export const deleteAppSettingsMany = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { appSettings },
  } = req;

  if (appSettings && appSettings.length) {
    (appSettings || []).forEach(async (appSettingId: number) => {
      await getManager().transaction(async (em) => {
        await em.update(Appsettings, { appSettingId }, { updatedBy: userId });
        await em.softDelete(Appsettings, appSettingId);
      });
    });
  }

  res.sendStatus(204);
};
