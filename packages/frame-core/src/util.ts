export const stringify: typeof JSON.stringify = (value, replacer, space) =>
  JSON.stringify(
    value,
    (key, value_) => {
      const value = typeof value_ === 'bigint' ? value_.toString() : value_
      return typeof replacer === 'function' ? replacer(key, value) : value
    },
    space,
  )

export function isAllowedOrigin(
  allowedOrigins: (string | RegExp)[],
  origin: string,
): boolean {
  for (const allowedOrigin of allowedOrigins) {
    if (origin === allowedOrigin || allowedOrigin === '*') {
      return true
    }
    if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
      return true
    }
  }
  return false
}
