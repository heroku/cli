import {vars} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'
import cp from 'node:child_process'
import fs from 'node:fs'
import {promisify} from 'node:util'
const execFile = promisify(cp.execFile)

import debug from 'debug'
const gitDebug = debug('git')

export default class Git {
  createRemote(remote: string, url: string) {
    return this.hasGitRemote(remote)
      .then(exists => exists ? null : this.exec(['remote', 'add', remote, url]))
  }

  public async exec(args: string[]): Promise<string> {
    gitDebug('exec: git %o', args)
    try {
      const {stderr, stdout} = await execFile('git', args)
      if (stderr) process.stderr.write(stderr)
      return stdout.trim()
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        ux.error('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
      }

      throw error
    }
  }

  async getBranch(symbolicRef: string) {
    return this.exec(['symbolic-ref', '--short', symbolicRef])
  }

  async getCommitTitle(ref: string) {
    return this.exec(['log', ref || '', '-1', '--pretty=format:%s'])
  }

  async getRef(branch: string) {
    return this.exec(['rev-parse', branch || 'HEAD'])
  }

  hasGitRemote(remote: string) {
    return this.remoteUrl(remote)
      // eslint-disable-next-line unicorn/prefer-native-coercion-functions
      .then((remote?: string) => Boolean(remote))
  }

  httpGitUrl(app: string) {
    return `https://${vars.httpGitHost}/${app}.git`
  }

  inGitRepo() {
    try {
      fs.lstatSync('.git')
      return true
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  async readCommit(commit: string) {
    const branch = await this.getBranch('HEAD')
    const ref = await this.getRef(commit)
    const message = await this.getCommitTitle(ref)

    return {
      branch,
      message,
      ref,
    }
  }

  remoteFromGitConfig() {
    return this.exec(['config', 'heroku.remote']).catch(() => {})
  }

  async remoteUrl(name: string) {
    const remotes = await this.exec(['remote', '-v'])
    return remotes.split('\n')
      .map(r => r.split('\t'))
      .find(r => r[0] === name)?.[1]
      ?.split(' ')[0] ?? ''
  }

  public spawn(args: string[]) {
    return new Promise((resolve, reject) => {
      gitDebug('spawn: git %o', args)
      const s = cp.spawn('git', args, {stdio: [0, 1, 2]})
      s.on('error', (err: Error & {code?: string}) => {
        if (err.code === 'ENOENT') {
          ux.error('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
        } else reject(err)
      })
      s.on('close', resolve)
    })
  }

  url(app: string) {
    return this.httpGitUrl(app)
  }
}
