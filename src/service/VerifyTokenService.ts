import { getManager } from 'typeorm';

import { Tokens } from '../model/Tokens';
import { BadRequestError } from '../error';
import logger from './log';

interface Request {
  email: string;
  token: string;
}

interface Response {
  message: string;
}

class VerifyTokenService {
  private static instance: VerifyTokenService;

  constructor() {
    if (VerifyTokenService.instance instanceof VerifyTokenService) {
      return VerifyTokenService.instance;
    }
    VerifyTokenService.instance = this;
  }

  public async execute(request: Request): Promise<Response> {
    const { email, token } = request;

    const verification = await this.getVerification(email, token);

    if (!verification) {
      logger.error(`Invalid email id : [${email}] or token : [${token}]`);
      throw new BadRequestError('Invalid email id or token', 'INVALID_EMAIL_ID_OR_TOKEN');
    }

    // this.validateVerification(verification);

    // verification.status = VerificationStatus.COMPLETED;
    // await getCustomRepository(VerificationsRepository).save(verification);

    const response: Response = {
      message: 'TOKEN_VERIFIED_SUCCESS',
    };

    return response;
  }

  // private validateVerification(verification: any) {
  //   if (utc(verification.expireAt).isBefore(utc())) {
  //     logger.error(`token has been expired : [${verification.expireAt}]`);
  //     throw new BadRequestError('token has been expired.', 'TOKEN_EXPIRED');
  //   }

  //   if (verification.status === VerificationStatus.COMPLETED) {
  //     logger.error(`verification is already completed : [${verification.status}]`);
  //     throw new BadRequestError(
  //       'verification is already completed',
  //       'VERIFICATION_ALREADY_COMPLETED',
  //     );
  //   }
  // }

  private async getVerification(email: string, token: string) {
    const query = getManager()
      .createQueryBuilder(Tokens, 'token')
      .leftJoinAndSelect('token.user', 'user')
      .andWhere('token.forgetPasswordToken = :token', { token })
      .andWhere('user.email = :email', { email });

    const tokenData = await query.getOne();

    return tokenData;
  }
}

export default VerifyTokenService;
