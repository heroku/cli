import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

function formatKey(key: string) {
  const [name, pub, email] = key.trim().split(/\s/)
  return `${name} ${pub.slice(0, 10)}...${pub.slice(-10)} ${color.user(email)}`
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
      hux.styledJSON(keys)
    } else if (keys.length === 0) {
      ux.warn('You have no SSH keys.')
    } else {
      hux.styledHeader(`${color.user(keys[0].email || '')} keys`)
      if (flags.long) {
        keys.forEach(k => ux.stdout(k.public_key))
      } else {
        keys.map(k => ux.stdout(formatKey(k.public_key || '')))
      }
    }
  }
}
