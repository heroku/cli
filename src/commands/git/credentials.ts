import {Command, vars} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as readline from 'node:readline'

export class GitCredentials extends Command {
  static args = {
    command: Args.string({description: 'command name of the git credentials', required: true}),
  }
  static description = 'internal command for git-credentials'
  static hidden = true

  async run() {
    const {args} = await this.parse(GitCredentials)
    switch (args.command) {
      case 'erase':
      // eslint-ignore-next-line no-fallthrough
      case 'store': {
        // ignore
        break
      }

      case 'get': {
        const {host, protocol} = await this.readInput()

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

      default: {
        throw new Error(`unknown command: ${args.command}`)
      }
    }
  }

  /**
   * Reads git-credential input from stdin
   * Format: key=value pairs, one per line, terminated by blank line
   * Returns parsed object with protocol, host, username, and path
   */
  private async readInput(): Promise<{host?: string; path?: string; protocol?: string; username?: string;}> {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
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
        process.stdin.pause()
        resolve(input)
      })
    })
  }
}
