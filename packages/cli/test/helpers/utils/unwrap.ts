const unwrap = function (str: string): string {
  let sanitize = str.replace(/\n ([▸›»]) {3}/g, '')
  sanitize = sanitize.replace(/ ([▸›»]) {3}/g, '')

  return sanitize
}

export {unwrap}
