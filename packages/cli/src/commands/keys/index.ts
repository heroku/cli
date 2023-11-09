import {Args, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags, Command} from '@heroku-cli/command'

function formatKey(key: string) {
  const trimmedKey = key.trim().split(/\s/)
  return `${trimmedKey[0]} ${trimmedKey[1].slice(0, 10)}...${trimmedKey[1].slice(-10)} ${color.green(trimmedKey[2])}`
}

export default class Keys extends Command {
  static description = 'display your SSH keys'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    long: flags.boolean({char: 'l', description: 'display full SSH keys'}),
  }

  async run() {
    const {flags} = await this.parse(Keys)
    const {body: keys} = await this.heroku.get<Heroku.Key[]>('/account/keys')
    if (flags.json) {
      ux.styledJSON(keys)
    } else if (keys.length === 0) {
      ux.warn('You have no SSH keys.')
    } else {
      ux.styledHeader(`${color.cyan(keys[0].email || '')} keys`)
      if (flags.long) {
        keys.forEach(k => ux.log(k.public_key))
      } else {
        keys.map(k => ux.log(formatKey(k.public_key || '')))
      }
    }
  }
}

