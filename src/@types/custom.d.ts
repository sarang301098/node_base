type AddMongoDocType<T, U> = T & { mongoDoc?: U };
type WithChildern<T> = T & { children?: T[] };
