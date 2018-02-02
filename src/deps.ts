import FS = require('fs-extra')
import {HTTP} from 'http-call'

import file = require('./file')
import UserConfig from './user_config'

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
    return fetch('./user_config').default
  },
}

const cache: any = {}

function fetch(s: string) {
  if (!cache[s]) {
    cache[s] = require(s)
  }
  return cache[s]
}
