import {vars} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'
import cp from 'node:child_process'
import fs from 'node:fs'
import {promisify} from 'node:util'
const execFilePromise = promisify(cp.execFile)

import debug from 'debug'
const gitDebug = debug('git')

export default class Git {
  private readonly execFile = execFilePromise

  /** Configures `heroku git:credentials` as a Git credential helper
  * that is URL-scoped to Heroku Git operations only.
  */
  async configureCredentialHelper() {
    const {httpGitHost} = vars
    const key = `credential.https://${httpGitHost}.helper`
    const helper = '!heroku git:credentials'
    // Read the existing value first so we can skip the write when it is already
    // set to our helper. `git config` rewrites the global config file (new inode)
    // even when the value is byte-identical, and this runs before nearly every
    // command via the init hook, so the no-op write churns the user's gitconfig.
    // When the key is absent the `--get` exits non-zero and `exec` throws, so we
    // treat that as an empty string.
    const existing = await this.exec(['config', '--global', '--get', key]).catch(() => '')
    if (existing === helper) return
    await this.exec(['config', '--global', key, helper])
  }

  createRemote(remote: string, url: string) {
    return this.hasGitRemote(remote)
      .then(exists => exists ? null : this.exec(['remote', 'add', remote, url]))
  }

  /** Erases stored credentials for the Heroku Git host */
  async eraseCredentials() {
    const {httpGitHost} = vars
    await this.spawn(['credential', 'reject'], {
      input: `protocol=https\nhost=${httpGitHost}\n\n`,
      stdio: ['pipe', 'ignore', 'ignore'],
    })
  }

  public async exec(args: string[]): Promise<string> {
    gitDebug('exec: git %o', args)
    try {
      const {stderr, stdout} = await this.execFile('git', args)
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
      return false
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

  /** Removes `heroku git:credentials` from the global config */
  async removeCredentialHelper() {
    const {httpGitHost} = vars
    await this.exec(['config', '--global', '--unset-all', `credential.https://${httpGitHost}.helper`])
  }

  public spawn(args: string[], options: {input?: string; stdio?: cp.StdioOptions;} = {}) {
    return new Promise((resolve, reject) => {
      gitDebug('spawn: git %o', args)
      const s = cp.spawn('git', args, {stdio: options.stdio ?? [0, 1, 2]})

      if (options.input && s.stdin) {
        s.stdin.write(options.input)
        s.stdin.end()
      }

      s.on('error', (err: Error & {code?: string}) => {
        if (err.code === 'ENOENT') {
          try {
            ux.error('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
          } catch (error) {
            reject(error)
          }
        } else reject(err)
      })
      s.on('close', resolve)
    })
  }

  url(app: string) {
    return this.httpGitUrl(app)
  }
}
