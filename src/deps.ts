import {HTTP} from '@heroku/http-call'
import UserConfig from './user-config.js'
import FS from 'fs-extra'

export default {
  get fs() {
    return FS
  },
  get HTTP() {
    return HTTP
  },
  get UserConfig() {
    return UserConfig
  },
}
