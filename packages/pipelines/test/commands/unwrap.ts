export default function unwrap(str: string) {
  let sanitize = str.replace(/\n ([▸!]) {3}/g, '')
  sanitize = sanitize.replace(/ ([▸!]) {4}/g, '')

  return sanitize
}
