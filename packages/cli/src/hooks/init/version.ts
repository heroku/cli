import {Hook} from '@oclif/config'

const Whitelist = [
  'HEROKU_API_KEY',
  'HEROKU_APP',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  'SSL_CA_FILE',
  'SSL_KEY_FILE',
]

export const version: Hook.Init = async function () {
  if (['-v', '--version', 'version'].includes(process.argv[2])) {
    for (const env of Whitelist) {
      if (process.env[env]) {
        const value = env === 'HEROKU_API_KEY' ? 'to [REDACTED]' : `to ${process.env[env]}`
        this.warn(`${env} set ${value}`)
      }
    }
  }
}
