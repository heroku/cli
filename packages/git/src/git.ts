import {vars} from '@heroku-cli/command'
import * as cp from 'child_process'
import ux from 'cli-ux'
import {promisify} from 'util'
const execFile = promisify(cp.execFile)

const debug = require('debug')('git')

export default class Git {
  async exec(args: string[]): Promise<string> {
    debug('exec: git %o', args)
    try {
      const {stdout, stderr} = await execFile('git', args)
      if (stderr) process.stderr.write(stderr)
      return stdout.trim()
    } catch (error) {
      if (error.code === 'ENOENT') {
        ux.error('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
      }
      throw error
    }
  }

  spawn(args: string[]) {
    return new Promise((resolve, reject) => {
      debug('spawn: git %o', args)
      const s = cp.spawn('git', args, {stdio: [0, 1, 2]})
      s.on('error', (err: Error & {code?: string}) => {
        if (err.code === 'ENOENT') {
          ux.error('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
        } else reject(err)
      })
      s.on('close', resolve)
    })
  }

  remoteFromGitConfig() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return this.exec(['config', 'heroku.remote']).catch(() => {})
  }

  sshGitUrl(app: string) {
    return `git@${vars.gitHost}:${app}.git`
  }

  httpGitUrl(app: string) {
    return `https://${vars.httpGitHost}/${app}.git`
  }

  async remoteUrl(name: string) {
    const remotes = await this.exec(['remote', '-v'])
    return remotes.split('\n')
    .map(r => r.split('\t'))
    .find(r => r[0] === name)![1]
    .split(' ')[0]
  }

  url(app: string, ssh: boolean) {
    return ssh ? this.sshGitUrl(app) : this.httpGitUrl(app)
  }
}
