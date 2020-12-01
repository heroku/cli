import {Command} from '@heroku-cli/command'
import cli from 'cli-ux'

export default class Auth2faGenerate extends Command {
  static description = `generates 2fa recovery codes
If you lose access to your two-factor device, e.g. you lose your phone or it is wiped, you can still log in to your account. When prompted for the second factor after entering your account password, choose "Enter a Recovery Code.” You can then enter one of your recovery codes instead of a token from your two-factor device. Note that each recovery code can only be used once.

Running this command will replace existing codes.`

  static aliases = [
    'twofactor:generate-recovery-codes',
    '2fa:generate-recovery-codes',
    'auth:2fa:generate',
  ]

  async run() {
    cli.warn('DEPRECATION WARNING: this command has been removed, in favor of generating recovery codes in your Account Settings in a browser.')
  }
}
