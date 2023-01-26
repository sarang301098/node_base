import { getRepository, FindConditions, In } from 'typeorm';

import { MailService } from '../service/Mail';
import { BadRequestError } from '../error';
import { Users } from '../model/Users';

import config from '../config';
import logger from './log';

import { signForgetPasswordToken } from '../service/token';
import { PropaneUserType } from '../constants';

interface Request {
  email?: string;
  userType: string;
  countryCode?: string;
  mobileNumber?: string;
}

interface Response {
  message: string;
  verification: string | number;
}

class ForgetPasswordService {
  private static instance: ForgetPasswordService;

  constructor() {
    if (ForgetPasswordService.instance instanceof ForgetPasswordService) {
      return ForgetPasswordService.instance;
    }
    ForgetPasswordService.instance = this;
  }

  public async execute(request: Request): Promise<Response> {
    const { email, userType, countryCode, mobileNumber } = request;
    let verification: string | number;

    let where: FindConditions<Users> = {};
    let isSms = false;

    if (
      userType === PropaneUserType.VENDOR ||
      userType === PropaneUserType.DRIVER ||
      userType === PropaneUserType.USER
    )
      isSms = true;

    if (isSms) {
      where = { ...where, countryCode, mobileNumber, userType };
    } else {
      where = { ...where, email, userType: In(['admin', 'sub_admin']) };
    }

    const userRepository = getRepository(Users);
    const user = await userRepository.findOne(where);

    if (!user) {
      logger.error('Invalid credential');
      throw new BadRequestError('Invalid credential');
    }

    try {
      const { link } = await this.getForgetPasswordLink(user.id as string);
      verification = link;
      this.sendMail(user, link);
    } catch (e) {
      throw new Error('Please contact admin.');
    }

    const response: Response = {
      message: 'RESETPASSWORD_SEND_SUCCESS',
      verification,
    };

    return response;
  }

  private async getForgetPasswordLink(userId: string) {
    const token = await signForgetPasswordToken(userId);
    const link = `${config.FRONTEND_BASE_URL}${config.FRONTEND_CHANGE_PASSWORD_URL}?token=${token}`;
    return { link, token };
  }

  private async sendMail(user: Users, link: string) {
    const mailService = new MailService();
    const mailBody = {
      link,
      text: 'forgot_password',
      subject: 'Reset Password',
      to: user.email,
      fullname: user.fullName,
      mobileNo: `${user.countryCode}${user.mobileNumber}`,
      actor: user.userType,
      email: user.email,
    };
    await mailService.send(mailBody);
  }
}

export default ForgetPasswordService;
