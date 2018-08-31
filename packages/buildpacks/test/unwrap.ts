'use strict'

const unwrap = function (str: string) {
  let sanitize = str.replace(/\n ([›»]) {3}/g, '')
  sanitize = sanitize.replace(/ ([›»]) {3}/g, '')

  return sanitize
}

export {unwrap}
