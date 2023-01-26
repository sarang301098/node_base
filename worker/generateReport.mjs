import { parentPort, workerData } from 'worker_threads';
import { existsSync, statSync } from 'fs';

import { sendMail } from './helper/sendMail.mjs';
import { createPdf } from './helper/createPdf.mjs';

async function init() {
  try {
    const {
      templateName,
      templateData,
      pdfName,
      user,
      emailTemplateData,
      recipients,
      language,
      additionalEmails,
    } = workerData;
    const { filePath } = await createPdf(templateName, templateData, pdfName, language);

    let isAttachmentRequired = false;
    if (existsSync(filePath) && Math.floor(statSync(filePath).size / (1024 * 1024)) < 25) {
      isAttachmentRequired = true;
    }

    if (user?.email || (recipients && recipients?.length)) {
      await sendMail(
        {
          email: recipients && recipients.length ? recipients : user.email,
          attachment: isAttachmentRequired ? { filename: pdfName, path: filePath } : undefined,
          cc: additionalEmails,
        },
        { ...emailTemplateData, isFileAttached: isAttachmentRequired },
      );
    }

    if (parentPort) {
      parentPort.postMessage(
        `Mail sent on: [${recipients && recipients?.length ? recipients.join(',') : user.email}${
          additionalEmails && additionalEmails?.length ? ', ' + additionalEmails?.join(',') : ''
        }]`,
      );
    }
  } catch (_) {}
}

init();
