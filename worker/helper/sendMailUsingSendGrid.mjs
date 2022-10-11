import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sendGrid from '@sendgrid/mail';
import Mail from '@sendgrid/helpers/classes/mail.js';
import ejs from 'ejs';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { REPORT_MAIL_SUBJECT, SENDGRID_API_KEY, GMAIL_USER } = process.env;

const getTemplatePath = (templateName) => join(__dirname, '..', '..', 'views', templateName);
const getTemplateHTML = async (path, data, opts = {}) => await ejs.renderFile(path, data, opts);

const setAPIKey = () => sendGrid.setApiKey(SENDGRID_API_KEY);

const getAttachmentData = (attachment) => {
  const attachmentData = [];

  attachment.forEach((data) => {
    attachmentData.push({
      content: fs.readFileSync(data.path).toString('base64'),
      filename: data.filename,
      type: 'application/pdf',
      disposition: 'attachment',
    });
  });

  return attachmentData;
};

export async function sendMail({ email: to, attachment, cc }, templateData) {
  const html = await getTemplateHTML(getTemplatePath('report_email.ejs'), templateData);
  setAPIKey();

  const mail = new Mail();

  mail.setFrom(`PropaneBros <${GMAIL_USER}>`);
  mail.addTo(to, cc);
  mail.setSubject(REPORT_MAIL_SUBJECT.replace(':reportType', templateData.reportType));
  mail.addHtmlContent(html);

  mail.setAttachments(
    Array.isArray(attachment) ? getAttachmentData(attachment) : getAttachmentData([attachment]),
  );

  return sendGrid.send(mail);
}
