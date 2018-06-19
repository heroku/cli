import {Command} from '@heroku-cli/command'
import ux from 'cli-ux'

export default class Auth2faGenerate extends Command {
  static description = `generates 2fa recovery codes
If you lose access to your two-factor device, e.g. you lose your phone or it is wiped, you can still log in to your account. When prompted for the second factor after entering your account password, choose "Enter a Recovery Code.” You can then enter one of your recovery codes instead of a token from your two-factor device. Note that each recovery code can only be used once.

Running this command will replace existing codes.`

  static aliases = [
    'twofactor:generate-recovery-codes',
    '2fa:generate-recovery-codes',
    'auth:2fa:generate',
  ]

  static example = `$ heroku auth:2fa:generate
Password: ********************
Recovery codes:
02799c92ab3ba7c7
09aea052a72b6a22
361e00bb82c7cbd4
588ac05dec23952c
6020ef9ec364066b
6cfd923315875e78
7c576b935eafc452
8c00eeb258ee565e
a37c5c6985f56e66
f82e7c2a50737494`

  async run() {
    const password = await ux.prompt('Password', {type: 'hide'})
    const headers = {'Heroku-Password': password}
    const {body: codes} = await this.heroku.post<string[]>('/account/recovery-codes', {headers})
    for (let code of codes) {
      ux.log(code)
    }
  }
}
