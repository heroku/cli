import {ux} from '@oclif/core/ux'
import * as Interfaces from '@oclif/core/interfaces'

export const validateArgvPresent = (argv: Interfaces.ParserOutput['argv'], isUnset = false) => {
  if (argv.length === 0) {
    ux.error(`Usage: heroku ci:config:${isUnset ? 'unset' : 'set'} KEY1 [KEY2 ...]\nMust specify KEY to ${isUnset ? 'unset' : 'set'}.`, {exit: 1})
  }
}
