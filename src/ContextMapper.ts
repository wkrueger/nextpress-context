export type ContextMapper = {
  id: string
  envKeys: string[]
  optionalKeys: string[]
  envContext: (i: { getKey: (s: string) => string | undefined }) => any
}

const validateType = <Type>() => <R extends Type>(i: R) => i
export const createContextMapper = validateType<ContextMapper>()
