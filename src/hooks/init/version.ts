import {Hook} from '@oclif/core/hooks'

const allowlist = [
  'HEROKU_API_KEY',
  'HEROKU_APP',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  'SSL_CA_FILE',
  'SSL_KEY_FILE',
]

const version: Hook.Init = async function () {
  const arg = process.argv[2]
  if (!arg) return

  const additionalVersionFlags = this.config.pjson?.oclif?.additionalVersionFlags || []
  const isVersionCommand = arg === '--version' || additionalVersionFlags.includes(arg)

  if (isVersionCommand) {
    for (const env of allowlist) {
      const value = process.env[env]
      if (value) {
        const displayValue = env === 'HEROKU_API_KEY' ? 'to [REDACTED]' : `to ${value}`
        this.warn(`${env} set ${displayValue}`)
      }
    }
  }
}

export default version
