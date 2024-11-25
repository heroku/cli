import * as fs from 'fs-extra'
import {vars} from '@heroku-cli/command'

const gh = require('github-url-to-object')
const spawn = require('child_process').spawn
const tmp = require('tmp')

const NOT_A_GIT_REPOSITORY = 'not a git repository'
const RUN_IN_A_GIT_REPOSITORY = 'Please run this command from the directory containing your project\'s git repo'

const NOT_ON_A_BRANCH = 'not a symbolic ref'
const CHECKOUT_A_BRANCH = 'Please checkout a branch before running this command'

function runGit(...args: string[]): Promise <string> {
  const git = spawn('git', args)

  return new Promise((resolve, reject) => {
    git.on('exit', (exitCode: number) => {
      if (exitCode === 0) {
        // not all git commands write data to stdout
        resolve(exitCode.toString(10))
        return
      }

      const error = (git.stderr.read() || 'unknown error').toString().trim()
      if (error.toLowerCase().includes(NOT_A_GIT_REPOSITORY)) {
        reject(RUN_IN_A_GIT_REPOSITORY)
        return
      }

      if (error.includes(NOT_ON_A_BRANCH)) {
        reject(CHECKOUT_A_BRANCH)
        return
      }

      reject(new Error(`Error while running 'git ${args.join(' ')}' (${error})`))
    })

    git.stdout.on('data', (data: any) => resolve(data.toString().trim()))
  })
}

async function getRef(branch: string): Promise<string | undefined> {
  return runGit('rev-parse', branch || 'HEAD')
}

async function getBranch(symbolicRef: string): Promise<string | undefined> {
  return runGit('symbolic-ref', '--short', symbolicRef)
}

async function getCommitTitle(ref: string): Promise<string | undefined> {
  return runGit('log', ref || '', '-1', '--pretty=format:%s')
}

async function createArchive(ref: string): Promise<any> {
  const tar = spawn('git', ['archive', '--format', 'tar.gz', ref])
  const file = tmp.fileSync({postfix: '.tar.gz'})
  const write = tar.stdout.pipe(fs.createWriteStream(file.name))

  return new Promise((resolve, reject) => {
    write.on('close', () => resolve(file.name))
    write.on('error', reject)
  })
}

async function githubRepository() {
  const remote = await runGit('remote', 'get-url', 'origin')
  const repository = gh(remote)

  if (repository === null) {
    throw new Error('Not a GitHub repository')
  }

  return repository
}

async function readCommit(commit: string) {
  const branch = await getBranch('HEAD')
  const ref = await getRef(commit)
  const message = await getCommitTitle(ref!)

  return Promise.resolve({
    branch,
    ref,
    message,
  })
}

function sshGitUrl(app: string) {
  return `git@${vars.gitHost}:${app}.git`
}

function gitUrl(app?: string) {
  return `https://${vars.httpGitHost}/${app}.git`
}

/**
 * Lists remotes by their url and returns an
 * array of objects containing the name and kind
 *
 * @return A map of remotes whose key is the url
 * and value is an array of objects containing
 * the 'name' (heroku, heroku-dev, etc.) and 'kind' (fetch, push, etc.)
 */
async function listRemotes(): Promise<Map<string, {name: string, kind: string}[]>> {
  const gitRemotes = await runGit('remote', '-v')
  const lines = gitRemotes.trim().split('\n')
  const remotes = lines.map(line => line.trim().split(/\s+/)).map(([name, url, kind]) => ({name, url, kind}))
  const remotesByUrl = new Map<string, {name: string, kind: string}[]>()

  remotes.forEach(remote => {
    const {url, ...nameAndKind} = remote
    const entry = remotesByUrl.get(url) ?? []
    entry.push(nameAndKind)
    remotesByUrl.set(url, entry)
  })
  return remotesByUrl
}

function inGitRepo() {
  try {
    fs.lstatSync('.git')
    return true
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error
  }
}

async function rmRemote(remote: string) {
  try {
    await runGit('remote', 'rm', remote)
  } catch (error) {
    debugger
  }
}

async function hasGitRemote(remote: string) {
  const remotes = await runGit('remote')
  return remotes.split('\n').find(r => r === remote)
}

async function createRemote(remote: string, url: string) {
  const exists = await hasGitRemote(remote)
  if (!exists) {
    return runGit('remote', 'add', remote, url)
  }

  return null
}

export {
  createArchive,
  githubRepository,
  readCommit,
  sshGitUrl,
  gitUrl,
  createRemote,
  listRemotes,
  rmRemote,
  inGitRepo,
}
