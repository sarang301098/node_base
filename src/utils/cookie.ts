import { parse } from 'cookie';

export const parseCookie = (rawCookie: string): Record<string, string> => parse(rawCookie);

export const getCookie = (rawCookie: string): Record<string, string> | null => {
  if (!rawCookie) return null;
  const cookie = parseCookie(rawCookie);

  return cookie;
};

export const getAuthCookie = (rawCookie: string): string | null => {
  const cookie = getCookie(rawCookie);
  return cookie && cookie.token;
};
