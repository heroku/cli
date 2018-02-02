import {Config as Base, ConfigOptions} from '@cli-engine/config'
import * as path from 'path'

export default class Config extends Base {
  constructor(opts: ConfigOptions = {}) {
    super({...opts, root: path.join(__dirname, '../..')})
  }
}
