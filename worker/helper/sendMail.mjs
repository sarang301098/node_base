import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import ejs from 'ejs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { REPORT_MAIL_SUBJECT, GMAIL_USER, GMAIL_PASSWORD } = process.env;

const getTemplatePath = (templateName) => join(__dirname, '..', '..', 'views', templateName);
const getTemplateHTML = async (path, data, opts = {}) => await ejs.renderFile(path, data, opts);

function createTransport() {
  const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASSWORD },
  });

  return transport;
}

export async function sendMail({ email: to, attachment, cc }, templateData) {
  const html = await getTemplateHTML(getTemplatePath('report_email.ejs'), templateData);
  const transport = createTransport();
  return transport.sendMail({
    from: `Sarang Patel <${GMAIL_USER}>`,
    to,
    cc,
    subject: REPORT_MAIL_SUBJECT.replace(':reportType', templateData.reportType),
    html,
    ...(attachment && { attachments: [attachment] }),
  });
}
