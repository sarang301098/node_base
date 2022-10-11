import { promises as fsPromise, existsSync } from 'fs';
import puppeteer from 'puppeteer-core';
import moment from 'moment';
import { join } from 'path';
import ejs from 'ejs';

import logger from '../service/log';
import configs from '../config';

const { PUPPETEER_EXECUTABLE_PATH } = configs;

const getTemplatePath = (templateName: string) =>
  join(__dirname, '..', '..', 'views', templateName);

const getTemplateHTML = async (path: string, data: ejs.Data, opts = {}) =>
  await ejs.renderFile(path, data, opts);

const getReportFolderPath = async () =>
  await createDirIfNotExist(join(__dirname, '..', '..', configs.REPORT_FOLDER));

const getReportPath = async (pdfName: string) => join(await getReportFolderPath(), pdfName);

async function createDirIfNotExist(dir: string) {
  if (!existsSync(dir)) await fsPromise.mkdir(dir);
  return dir;
}

export async function createPdf(
  templateName: string,
  templateData: ejs.Data,
  pdfName: string,
): Promise<{ filePath: string }> {
  let startTime = moment.utc();
  const template = await getTemplateHTML(getTemplatePath(templateName), {
    ...templateData,
    moment,
  });
  logger.info('ejs to html is completed');
  logger.info(`time taken to convert ejs to html : ${moment.utc().diff(startTime, 'seconds')}s`);

  const filePath = await getReportPath(pdfName);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--enable-automation'],
    executablePath: PUPPETEER_EXECUTABLE_PATH,
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  const viewPort = { width: 1754, height: 960 };
  await page.setViewport(viewPort);

  logger.info('html loading started');
  startTime = moment.utc();
  await page.setContent(template, { waitUntil: 'networkidle0' });
  logger.info('html loading is completed');
  logger.info(`time taken in html loading : ${moment.utc().diff(startTime, 'seconds')}s`);

  logger.info('html to pdf is started');
  startTime = moment.utc();
  await page.pdf({ path: filePath, format: 'a4', printBackground: true });
  logger.info('html to pdf is completed');
  logger.info(`time taken to convert html to pdf : ${moment.utc().diff(startTime, 'seconds')}s`);

  await browser.close();
  return { filePath };
}
