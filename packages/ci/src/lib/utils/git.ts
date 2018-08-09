const spawn = require('child_process').spawn
import {Promise} from 'bluebird'

const fs = Promise.promisifyAll(require('fs'))
const tmp = Promise.promisifyAll(require('temp').track())

const gh = require('github-url-to-object')

const NOT_A_GIT_REPOSITORY = 'not a git repository'
const RUN_IN_A_GIT_REPOSITORY = 'Please run this command from the directory containing your project\'s git repo'
const NOT_ON_A_BRANCH = 'not a symbolic ref'
const CHECKOUT_A_BRANCH = 'Please checkout a branch before running this command'

function runGit(...args: any[]) {
  const git = spawn('git', args)

  return new Promise((resolve: any, reject: any) => {
    git.on('exit', (exitCode: number) => {
      if (exitCode === 0) {
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
      reject(`Error while running 'git ${args.join(' ')}' (${error})`)
    })

    git.stdout.on('data', (data: any) => resolve(data.toString().trim()))
  })
}

export async function getRef(branch: any) {
  return runGit('rev-parse', branch || 'HEAD')
}

export async function getBranch(symbolicRef: any) {
  return runGit('symbolic-ref', '--short', symbolicRef)
}

export async function getCommitTitle(ref: any) {
  return runGit('log', ref || '', '-1', '--pretty=format:%s')
}

export async function createArchive(ref: any) {
  const tar = spawn('git', ['archive', '--format', 'tar.gz', ref])
  const file = await tmp.openAsync({suffix: '.tar.gz'})
  const write = tar.stdout.pipe(fs.createWriteStream(file.path))

  return new Promise((resolve: any, reject: any) => {
    write.on('close', () => resolve(file.path))
    write.on('error', reject)
  })
}

export async function githubRepository() {
  const remote = await runGit('remote', 'get-url', 'origin')
  const repository = gh(remote)

  if (repository === null) {
    throw new Error('Not a GitHub repository')
  }

  return repository
}

function * readCommit(commit: any) {
  const branch = yield getBranch('HEAD')
  const ref = yield getRef(commit)
  const message = yield getCommitTitle(ref)

  return Promise.resolve({branch, ref, message})
}

module.exports = {
  createArchive,
  githubRepository,
  readCommit
}
