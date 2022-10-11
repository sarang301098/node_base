import { promises as fsPromise, existsSync, createWriteStream } from 'fs';
import { parentPort } from 'worker_threads';
import puppeteer from 'puppeteer-core';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';
import ejs from 'ejs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { PUPPETEER_EXECUTABLE_PATH, REPORT_FOLDER } = process.env;

const getTemplatePath = (templateName, language) =>
  join(__dirname, '..', '..', 'views', language, templateName);

const getTemplateHTML = async (path, data, opts = {}) => await ejs.renderFile(path, data, opts);

const getReportFolderPath = async () =>
  await createDirIfNotExist(join(__dirname, '..', '..', REPORT_FOLDER));

const getReportPath = async (pdfName) => join(await getReportFolderPath(), pdfName);

async function createDirIfNotExist(dir) {
  if (!existsSync(dir)) await fsPromise.mkdir(dir);
  return dir;
}

export async function createPdf(templateName, templateData, pdfName, language) {
  let startTime = moment.utc();
  const template = await getTemplateHTML(getTemplatePath(templateName, language), {
    ...templateData,
    moment,
  });

  if (parentPort) {
    parentPort.postMessage('ejs to html is completed');
    parentPort.postMessage(
      `time taken to convert ejs to html : ${moment.utc().diff(startTime, 'seconds')}s`,
    );
  }

  const filePath = await getReportPath(pdfName);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--enable-automation'],
    executablePath: PUPPETEER_EXECUTABLE_PATH,
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  const viewPort = { width: 1754, height: 960 };
  await page.setViewport(viewPort);

  if (parentPort) {
    parentPort.postMessage('html loading started');
  }
  startTime = moment.utc();
  await page.setContent(template, { waitUntil: 'networkidle0' });
  if (parentPort) {
    parentPort.postMessage(
      `time taken in html loading : ${moment.utc().diff(startTime, 'seconds')}s`,
    );
    parentPort.postMessage('html loading is completed');
    parentPort.postMessage('html to pdf is started');
  }

  startTime = moment.utc();
  const pdfStream = await page.createPDFStream({
    path: filePath,
    format: 'A4',
    printBackground: true,
  });
  const writeStream = createWriteStream(filePath);
  pdfStream.pipe(writeStream);

  if (parentPort) {
    parentPort.postMessage('html to pdf is completed');
    parentPort.postMessage(
      `time taken to convert html to pdf : ${moment.utc().diff(startTime, 'seconds')}s`,
    );
  }

  pdfStream.on('error', (error) => {
    throw new Error(`PDF creation stopped with this error: ${error.message}`);
  });

  pdfStream.on('end', async () => await browser.close());
  return { filePath };
}
