import {HTTP} from 'http-call'
import UserConfig from './user-config'
import FS = require('fs-extra')

import file = require('./file')

const cache: any = {}
function fetch(s: string) {
  if (!cache[s]) {
    cache[s] = require(s)
  }

  return cache[s]
}

export default {
  get fs(): typeof FS {
    return fetch('fs-extra')
  },
  get HTTP(): typeof HTTP {
    return fetch('http-call').HTTP
  },
  get file(): typeof file {
    return fetch('./file')
  },
  get UserConfig(): typeof UserConfig {
    return fetch('./user-config').default
  },
}
