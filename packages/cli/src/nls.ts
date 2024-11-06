import * as nlsValues from './package.nls.json'

/**
 * Non-localized strings util.
 *
 * @param key The key of the non-localized string to retrieve.
 * @return string
 */
export function nls<T extends keyof typeof nlsValues>(key: T): typeof nlsValues[T] {
  return nlsValues[key]
}
