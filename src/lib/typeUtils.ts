export function isNotString<T>(value: T): value is Exclude<T, string> {
  return typeof value !== 'string'
}

export function isNotNullish<T>(
  value: T
): value is Exclude<T, null | undefined> {
  return value != null
}

export function isNotArray<T>(value: T): value is Exclude<T, any[]> {
  return !Array.isArray(value)
}
