import { utc } from 'moment';

export const compareDates = (a: string | Date, b: string | Date): number => utc(a).diff(utc(b));
