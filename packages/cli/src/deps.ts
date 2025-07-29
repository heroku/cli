import {HTTP} from '@heroku/http-call'
import UserConfig from './user-config.js'
import FS from 'fs-extra'
import * as file from './file.js'

export default {
  get fs() {
    return FS
  },
  get HTTP() {
    return HTTP
  },
  get file() {
    return file
  },
  get UserConfig() {
    return UserConfig
  },
}
