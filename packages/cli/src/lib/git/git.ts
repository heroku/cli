import {vars} from '@heroku-cli/command'
import * as cp from 'child_process'
import {ux} from '@oclif/core'
import * as fs from 'fs'
import {promisify} from 'util'
const execFile = promisify(cp.execFile)

const debug = require('debug')('git')

export default class Git {
  public async exec(args: string[]): Promise<string> {
    debug('exec: git %o', args)
    try {
      const {stdout, stderr} = await execFile('git', args)
      if (stderr) process.stderr.write(stderr)
      return stdout.trim()
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        ux.error('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
      }

      throw error
    }
  }

  public spawn(args: string[]) {
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
    return this.exec(['config', 'heroku.remote']).catch(() => {})
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

  url(app: string) {
    return this.httpGitUrl(app)
  }

  async getBranch(symbolicRef: string) {
    return this.exec(['symbolic-ref', '--short', symbolicRef])
  }

  async getRef(branch: string) {
    return this.exec(['rev-parse', branch || 'HEAD'])
  }

  async getCommitTitle(ref: string) {
    return this.exec(['log', ref || '', '-1', '--pretty=format:%s'])
  }

  async readCommit(commit: string) {
    const branch = await this.getBranch('HEAD')
    const ref = await this.getRef(commit)
    const message = await this.getCommitTitle(ref)

    return Promise.resolve({
      branch: branch,
      ref: ref,
      message: message,
    })
  }

  inGitRepo() {
    try {
      fs.lstatSync('.git')
      return true
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  hasGitRemote(remote: string) {
    return this.remoteUrl(remote)
      .then((remote?: string) => Boolean(remote))
  }

  createRemote(remote: string, url: string) {
    return this.hasGitRemote(remote)
      .then(exists => !exists ? this.exec(['remote', 'add', remote, url]) : null)
  }
}

