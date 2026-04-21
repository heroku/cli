const unwrap = function (str: string): string {
  let sanitize = str.replaceAll(/\n ([▸›»]) {3}/g, '')
  sanitize = sanitize.replaceAll(/ ([▸›»]) {3}/g, '')

  return sanitize
}

export {unwrap}
