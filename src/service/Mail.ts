/* eslint-disable prefer-regex-literals */
import { getRepository } from 'typeorm';
import { Options as SMTPTransportOptions } from 'nodemailer/lib/smtp-transport';
import nodemailer, { SentMessageInfo } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Auth } from 'googleapis';

import { EmailTemplates } from '../model/EmailTemplates';

import config from '../config';
import logger from './log';

export interface MailBody {
  to?: string | Array<string>;
  qty?: string;
  text?: string;
  html?: string;
  link?: string;
  actor?: string;
  email?: string;
  image?: string;
  total?: string;
  address?: string;
  comment?: string;
  subject?: string;
  orderId?: string;
  message?: string;
  endDate?: string;
  salesTax?: string;
  planName?: string;
  fullname?: string;
  language?: string;
  password?: string;
  mobileNo?: string;
  promocode?: string;
  startDate?: string;
  planPrice?: string;
  attachment?: string;
  deliverFee?: string;
  serviceFee?: string;
  serviceCharge?: string;
  promocodeDiscount?: string;
  adminContactEmail?: string;
}

export class MailService {
  private transport: Mail | undefined;
  private static instance: MailService;

  private oauth2Client = new Auth.OAuth2Client({
    clientId: config.GMAIL_CLIENT_ID,
    clientSecret: config.GMAIL_CLIENT_SECRET,
    redirectUri: 'https://developers.google.com/oauthplayground',
  });

  constructor() {
    if (MailService.instance instanceof MailService) {
      return MailService.instance;
    }
    this.transport = this.createTransport();
    MailService.instance = this;
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

  async send({
    to,
    qty,
    link,
    text,
    total,
    actor,
    image,
    email,
    comment,
    subject,
    message,
    address,
    orderId,
    endDate,
    fullname,
    planName,
    password,
    salesTax,
    mobileNo,
    planPrice,
    startDate,
    promocode,
    deliverFee,
    serviceFee,
    serviceCharge,
    adminContactEmail,
    promocodeDiscount,
  }: MailBody): Promise<SentMessageInfo> {
    const transport = (await this.createSmtpTransport()) || this.transport;
    if (!transport) {
      logger.error(`Transport is not present to send email.`);
      throw new Error(`Transport is not present to send email.`);
    }

    const emailTempRepository = getRepository(EmailTemplates);
    const emailTemplate = await emailTempRepository.findOne({ key: text });

    const html = (emailTemplate?.template || '')
      .replace(new RegExp('{qty}', 'g'), qty || '')
      .replace(new RegExp('{link}', 'g'), link || '')
      .replace(new RegExp('{logo}', 'g'), image || '')
      .replace(new RegExp('{email}', 'g'), email || '')
      .replace(new RegExp('{total}', 'g'), total || '')
      .replace(new RegExp('{actor}', 'g'), actor || '')
      .replace(new RegExp('{name}', 'g'), fullname || '')
      .replace(new RegExp('{mobile}', 'g'), mobileNo || '')
      .replace(new RegExp('{subject}', 'g'), subject || '')
      .replace(new RegExp('{message}', 'g'), message || '')
      .replace(new RegExp('{endDate}', 'g'), endDate || '')
      .replace(new RegExp('{comment}', 'g'), comment || '')
      .replace(new RegExp('{address}', 'g'), address || '')
      .replace(new RegExp('{appname}', 'g'), 'Propane Bros')
      .replace(new RegExp('{password}', 'g'), password || '')
      .replace(new RegExp('{planName}', 'g'), planName || '')
      .replace(new RegExp('{salesTax}', 'g'), salesTax || '')
      .replace(new RegExp('{promocode}', 'g'), promocode || '')
      .replace(new RegExp('{startDate}', 'g'), startDate || '')
      .replace(new RegExp('{planPrice}', 'g'), planPrice || '')
      .replace(new RegExp('{serviceFee}', 'g'), serviceFee || '')
      .replace(new RegExp('{invoiceNumber}', 'g'), orderId || '')
      .replace(new RegExp('{deliverFee}', 'g'), deliverFee || '')
      .replace(new RegExp('{admin}', 'g'), adminContactEmail || '')
      .replace(new RegExp('{serviceCharge}', 'g'), serviceCharge || '')
      .replace(new RegExp('{promocodeDiscount}', 'g'), promocodeDiscount || '');

    return transport.sendMail({
      from: `Propane <${config.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  }
}
