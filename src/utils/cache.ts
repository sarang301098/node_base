import { combinations } from './binaryCombination';

// https://stackoverflow.com/a/14810722
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const objectMap = <T, U>(obj: Record<string, T>, fn: (v: T, k: string, i: number) => U) =>
  Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]));

const relationMap = {
  user: ['vendor', 'driver', 'subAdmin'],
};

const relationCombinationMap = objectMap(relationMap, (v) => combinations(v));

type allowedEntity = 'user';

export const getAllDetailCacheKeys = (entiry: allowedEntity, id: string): string[] => {
  return relationCombinationMap[entiry].map((relation) => `${entiry}:${id}:${relation}`);
};

export const createDetailCacheKey = (
  entiry: allowedEntity,
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: Record<string, any> = {},
): string => {
  const relation = relationMap[entiry].reduce(
    (prev, curr) => `${prev}:${curr}=${query[curr] ?? false}`,
    '',
  );
  return `${entiry}:${id}${relation}`;
};
