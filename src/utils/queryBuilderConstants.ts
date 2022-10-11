export const operators: Record<string, string> = {
  not: 'NOT ',
  pos: '+',
  neg: '-',
  add: '+',
  sub: '-',
  mul: '*',
  div: '/',
  or: 'OR',
  and: 'AND',
  eq: '=',
  ne: '!=',
  lt: '<',
  le: '<=',
  gt: '>',
  ge: '>=',
};

export const likeOperators: Record<
  string,
  (strings: TemplateStringsArray, query: string) => string
> = {
  equals: (_strings: TemplateStringsArray, query: string) => `${query}`,
  contains: (_strings: TemplateStringsArray, query: string) => `%${query}%`,
  startsWith: (_strings: TemplateStringsArray, query: string) => `${query}%`,
  endsWith: (_strings: TemplateStringsArray, query: string) => `%${query}`,
};
