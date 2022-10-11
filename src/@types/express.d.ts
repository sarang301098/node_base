declare namespace Express {
  export interface Request {
    user: import('../model/Users').Users;
    token: string;
  }
}

declare module '@chelmsfordbeer/pdf-creator-node';
