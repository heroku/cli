import {ux} from '@oclif/core'
import {Interfaces} from '@oclif/core'

export const validateArgvPresent = (argv: Interfaces.ParserOutput['argv'], isUnset = false) => {
  if (argv.length === 0) {
    ux.error(`Usage: heroku ci:config:${isUnset ? 'unset' : 'set'} KEY1 [KEY2 ...]\nMust specify KEY to ${isUnset ? 'unset' : 'set'}.`, {exit: 1})
  }
}
