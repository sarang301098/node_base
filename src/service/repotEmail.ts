import { Options as SMTPTransportOptions } from 'nodemailer/lib/smtp-transport';
import nodemailer, { SentMessageInfo } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Auth } from 'googleapis';
import config from '../config';
import logger from './log';

export interface MailBody {
  to?: string | Array<string>;
  text?: string;
  html?: string;
  subject?: string;
  attachments?: [];
}

export class MailReportService {
  private transport: Mail | undefined;
  private static instance: MailReportService;

  private oauth2Client = new Auth.OAuth2Client({
    clientId: config.GMAIL_CLIENT_ID,
    clientSecret: config.GMAIL_CLIENT_SECRET,
    redirectUri: 'https://developers.google.com/oauthplayground',
  });

  constructor() {
    if (MailReportService.instance instanceof MailReportService) {
      return MailReportService.instance;
    }
    this.transport = this.createTransport();
    MailReportService.instance = this;
  }

  private async createSmtpTransport() {
    if (config.GMAIL_CLIENT_ID && config.GMAIL_CLIENT_SECRET && config.GMAIL_REFRESH_TOKEN) {
      try {
        this.oauth2Client.setCredentials({ refresh_token: config.GMAIL_REFRESH_TOKEN });
        const accessToken = await this.oauth2Client.getAccessToken();

        if (accessToken && accessToken.token) {
          const options: SMTPTransportOptions = {
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: config.GMAIL_USER,
              clientId: config.GMAIL_CLIENT_ID,
              clientSecret: config.GMAIL_CLIENT_SECRET,
              refreshToken: config.GMAIL_REFRESH_TOKEN,
              accessToken: accessToken.token,
            },
          };

          return nodemailer.createTransport(options);
        }
      } catch (error) {
        logger.error(error);
      }
    }
  }

  private createTransport() {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_PASSWORD,
      },
    });

    return transport;
  }

  async send({ to, text, subject, attachments }: MailBody): Promise<SentMessageInfo> {
    const transport = (await this.createSmtpTransport()) || this.transport;

    if (!transport) {
      logger.error(`Transport is not present to send email.`);
      throw new Error(`Transport is not present to send email.`);
    }

    return transport.sendMail({
      from: `Propane <${config.GMAIL_USER}>`,
      to,
      text,
      subject,
      attachments: attachments,
    });
  }
}
