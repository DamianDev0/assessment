export type PathKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]:
    T[K] extends object
      ? PathKeys<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`
}[keyof T & string]
