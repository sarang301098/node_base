import { sign, verify } from 'jsonwebtoken';

import { Token } from '../constants';
import config from '../config';

export interface ITokenBase {
  jti: string;
  aud: Token;
  sub: string;
  iat: number;
  exp: number;
}

export interface IAccessToken extends ITokenBase {
  aud: Token.ACCESS;
}

export interface IRefreshToken extends ITokenBase {
  aud: Token.REFRESH;
}

export interface IForgetPasswordToken extends ITokenBase {
  aud: Token.FORGETPASSWORD;
}

export const signToken = (audience: Token, subject: string, expiresIn: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    sign({}, config.SECRET_HEX, { audience, subject, expiresIn }, (err, encoded) => {
      if (err || !encoded) {
        return reject(err);
      }
      resolve(encoded);
    });
  });
};

export const signAccessToken = (id: string): Promise<string> => {
  return signToken(Token.ACCESS, id, config.ACCESS_TOKEN_LIFETIME_MIN * 60);
};

export const signRefreshToken = (id: string): Promise<string> => {
  return signToken(Token.REFRESH, id, config.REFRESH_TOKEN_LIFETIME_MIN * 60);
};

export const signForgetPasswordToken = (id: string): Promise<string> => {
  return signToken(Token.FORGETPASSWORD, id, config.ACCESS_TOKEN_LIFETIME_MIN * 60);
};

export const verifyToken = (token: string, audience: Token): Promise<ITokenBase> => {
  return new Promise((resolve, reject) => {
    verify(token, config.SECRET_HEX, { audience }, (err, decoded) => {
      if (err || !decoded) {
        return reject(err);
      }
      resolve(decoded as ITokenBase);
    });
  });
};

export const isAccessToken = (payload: ITokenBase): payload is IAccessToken => {
  return payload.aud === Token.ACCESS;
};

export const isRefreshToken = (payload: ITokenBase): payload is IRefreshToken => {
  return payload.aud === Token.REFRESH;
};

export const isForgetPasswordToken = (payload: ITokenBase): payload is IForgetPasswordToken => {
  return payload.aud === Token.FORGETPASSWORD;
};
