import { resolve, parse, join, extname } from 'path';

import { Request } from 'express';
import { diskStorage, FileFilterCallback, StorageEngine } from 'multer';
import slug from 'slug';
import * as aws from 'aws-sdk';
import multerS3 from 'multer-s3';
import { Media } from '../constants';
import { generateRandomHex } from '../service/random';
import config from '../config';

const { MAX_FILE_SIZE_IN_MB, MAX_APK_FILE_SIZE_IN_MB } = config;

aws.config.update({
  accessKeyId: 'AKIA4SM52MV5PSS3EDWB' || config.AWS_ACCESS_KEY_ID,
  secretAccessKey: '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' || config.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1' || config.AWS_REGION,
});
const s3 = new aws.S3();

export const MAX_IMAGE_FILE_SIZE = MAX_FILE_SIZE_IN_MB * 1024 * 1024;
export const MAX_APK_FILE_SIZE = MAX_APK_FILE_SIZE_IN_MB * 1024 * 1024;

export const mediaFolder = resolve(__dirname, '..', '..', config.MEDIA_FOLDER);
export const reportFolder = resolve(__dirname, '..', '..', config.REPORT_FOLDER);

export const getMediaPath = (media: Media): string => resolve(mediaFolder, media);

export const getRelativePath = (media: Media, filename: string): string => join(media, filename);

export const imageFileFilter = (
  req: Request,
  file: Express.MulterS3.File,
  cb: FileFilterCallback,
): void => {
  // Allowed ext
  const fileTypes = /jpeg|jpg|png|gif|pdf|zip/;
  // Allowed mime
  const mimeTypes = /jpeg|jpg|png|gif|pdf|zip/;
  // Check ext
  const extName = fileTypes.test(extname(file.originalname).toLowerCase());
  // Check mime
  const mimeType = mimeTypes.test(file.mimetype);

  if (mimeType && extName) {
    return cb(null, true);
  }
  return cb(new Error('Error: Images Only!'));
};

export const apkFileFilter = (
  req: Request,
  file: Express.MulterS3.File,
  cb: FileFilterCallback,
): void => {
  // Allowed ext
  const fileTypes = /ex4|dll/;
  // Allowed mime
  const mimeTypes = /application\/octet-stream|application\/x-msdownload/;
  // Check ext
  const extName = fileTypes.test(extname(file.originalname).toLowerCase());
  // Check mime
  const mimeType = mimeTypes.test(file.mimetype);

  if (mimeType && extName) {
    return cb(null, true);
  }
  return cb(new Error('Error: APK Only!'));
};

export const storage = (mediaType: Media): StorageEngine =>
  diskStorage({
    destination: getMediaPath(mediaType),
    filename: (req, file, callback) => {
      const parsedName = parse(file.originalname);
      const hax = generateRandomHex(10);
      const fileName = `${hax}-${slug(parsedName.name)}${parsedName.ext}`;
      return callback(null, fileName);
    },
  });

export const s3Storage = (mediaType: Media): StorageEngine =>
  multerS3({
    s3: s3,
    bucket: 'gems-fx' || config.S3_USER_MEDIA_BUCKET,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const parsedName = parse(file.originalname);
      const hax = generateRandomHex(10);
      const fileName = `${mediaType}/${hax}-${slug(parsedName.name)}${parsedName.ext}`;
      cb(null, fileName);
    },
  });
