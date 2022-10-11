import { RequestHandler } from 'express';
import multer from 'multer';

import {
  storage,
  s3Storage,
  imageFileFilter,
  apkFileFilter,
  MAX_IMAGE_FILE_SIZE,
} from '../config/upload';
import { Media } from '../constants';

export const upload = (media: Media): multer.Multer =>
  multer({
    storage: storage(media),
    limits: { fileSize: MAX_IMAGE_FILE_SIZE },
    fileFilter: imageFileFilter,
  });

export const uploadS3 = (media: Media): multer.Multer =>
  multer({
    storage: s3Storage(media),
    limits: { fileSize: MAX_IMAGE_FILE_SIZE },
    fileFilter: imageFileFilter,
  });

export const uploadAPKS3 = (media: Media): multer.Multer =>
  multer({
    storage: s3Storage(media),
    fileFilter: apkFileFilter,
  });

export const singleFile = (media: Media, fieldName: string): RequestHandler =>
  upload(media).single(fieldName);

export const singleFileS3 = (media: Media, fieldName: string): RequestHandler =>
  uploadS3(media).single(fieldName);

export const singleAPKFileS3 = (media: Media, fieldName: string): RequestHandler =>
  uploadAPKS3(media).single(fieldName);
