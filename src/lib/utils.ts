export function indent(text: string, level = 1) {
  return text
    .split('\n')
    .map((line) => `${'    '.repeat(level)}${line}`)
    .join('\n')
}

/**
 * Type assertion.
 *
 * Useful in `.filter()` calls, as TypeScript will know to remove
 * null values from the output.
 */
export function isNotNullish<T>(value: T): value is NonNullable<T> {
  return value != null
}
