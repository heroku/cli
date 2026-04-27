import {Command, vars} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as readline from 'node:readline'

export class GitCredentials extends Command {
  static hidden = true

  static description = 'internal command for git-credentials'

  static args = {
    command: Args.string({required: true, description: 'command name of the git credentials'}),
  }

  /**
   * Reads git-credential input from stdin
   * Format: key=value pairs, one per line, terminated by blank line
   * Returns parsed object with protocol, host, username, and path
   */
  private async readInput(): Promise<{protocol?: string; host?: string; username?: string; path?: string}> {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      })

      const input: Record<string, string> = {}

      rl.on('line', (line: string) => {
        if (!line.trim()) {
          rl.close()
          return
        }

        const [key, value] = line.split('=', 2)
        if (key && value) {
          input[key] = value
        }
      })

      rl.on('close', () => {
        resolve(input)
      })
    })
  }

  async run() {
    const {args} = await this.parse(GitCredentials)
    switch (args.command) {
    case 'get': {
      const {protocol, host} = await this.readInput()

      const {httpGitHost} = vars
      if (protocol !== 'https' || host !== httpGitHost) {
        return
      }

      if (!this.heroku.auth) {
        throw new Error('not logged in')
      }

      ux.stdout(`protocol=https
host=${httpGitHost}
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
