const spawn = require('child_process').spawn
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const tmp = Promise.promisifyAll(require('temp').track())
const gh = require('github-url-to-object')

const NOT_A_GIT_REPOSITORY = 'not a git repository'
const RUN_IN_A_GIT_REPOSITORY = 'Please run this command from the directory containing your project\'s git repo'

const NOT_ON_A_BRANCH = 'not a symbolic ref'
const CHECKOUT_A_BRANCH = 'Please checkout a branch before running this command'

function runGit(...args) {
  const git = spawn('git', args)

  return new Promise((resolve, reject) => {
    git.on('exit', exitCode => {
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

      // eslint-disable-next-line prefer-promise-reject-errors
      reject(`Error while running 'git ${args.join(' ')}' (${error})`)
    })

    git.stdout.on('data', data => resolve(data.toString().trim()))
  })
}

async function getRef(branch) {
  return runGit('rev-parse', branch || 'HEAD')
}

async function getBranch(symbolicRef) {
  return runGit('symbolic-ref', '--short', symbolicRef)
}

async function getCommitTitle(ref) {
  return runGit('log', ref || '', '-1', '--pretty=format:%s')
}

async function createArchive(ref) {
  const tar = spawn('git', ['archive', '--format', 'tar.gz', ref])
  const file = await tmp.openAsync({suffix: '.tar.gz'})
  const write = tar.stdout.pipe(fs.createWriteStream(file.path))

  return new Promise((resolve, reject) => {
    write.on('close', () => resolve(file.path))
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

async function readCommit(commit) {
  const branch = await getBranch('HEAD')
  const ref = await getRef(commit)
  const message = await getCommitTitle(ref)

  return Promise.resolve({
    branch: branch,
    ref: ref,
    message: message,
  })
}

module.exports = {
  createArchive,
  githubRepository,
  readCommit,
}
