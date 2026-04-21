import {Command, vars} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import fs from 'node:fs'

export class GitCredentials extends Command {
  static hidden = true

  static description = 'internal command for git-credentials'

  static args = {
    command: Args.string({required: true, description: 'command name of the git credentials'}),
  }

  async run() {
    const {args} = await this.parse(GitCredentials)
    switch (args.command) {
    case 'get': {
      const stdin = readCredentialStdin()
      const {protocol, host} = parseCredentialStdin(stdin)
      if (protocol !== 'https' || host !== vars.httpGitHost) {
        return
      }

      if (!this.heroku.auth) {
        return
      }

      ux.stdout(`protocol=https
host=${vars.httpGitHost}
username=heroku
password=${this.heroku.auth}`)
      break
    }

    case 'erase':
    case 'store': {
      // ignore
      break
    }

    default: {
      throw new Error(`unknown command: ${args.command}`)
    }
    }
  }
}

function readCredentialStdin(): string {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function parseCredentialStdin(input: string): {protocol?: string; host?: string} {
  const out: {protocol?: string; host?: string} = {}
  for (const line of input.split('\n')) {
    if (!line || line === '\r') continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    if (key === 'protocol') out.protocol = value
    if (key === 'host') out.host = value
  }

  return out
}
