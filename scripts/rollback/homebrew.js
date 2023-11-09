const execa = require('execa')
const mkdirp = require('mkdirp')
const path = require('path')
const rm = require('rimraf')

const {ROLLBACK_VERSION, SKIP_GIT_PUSH} = process.env

async function setupGit() {
  const githubSetupPath = path.join(__dirname, '..', 'utils', '_github_setup')
  await execa(githubSetupPath)
}

async function rollbackHomebrew() {
  const tmp = path.join(__dirname, 'tmp')
  const homebrewDir = path.join(tmp, 'homebrew-brew')
  mkdirp.sync(tmp)
  rm.sync(homebrewDir)

  await setupGit()

  console.log(`cloning https://github.com/heroku/homebrew-brew to ${homebrewDir}`)
  await execa('git',
    [
      'clone',
      'git@github.com:heroku/homebrew-brew.git',
      homebrewDir,
    ],
  )
  console.log(`done cloning heroku/homebrew-brew to ${homebrewDir}`)

  // run in git in cloned heroku/homebrew-brew git directory
  const git = async (args, opts = {}) => {
    await execa('git', ['-C', homebrewDir, ...args], opts)
  }

  console.log('updating local git...')

  // get commit to revert
  const commitToRevert = await git(['log', `--grep=v${ROLLBACK_VERSION}`])

  if (commitToRevert.contains('revert')) {
    console.log(`${ROLLBACK_VERSION} has already been reverted`)
    process.exit(1)
  }

  // revert commit
  await git(['revert', commitToRevert])
  if (SKIP_GIT_PUSH === undefined) {
    await git(['push', 'origin', 'main'])
  }
}

rollbackHomebrew().catch(error => {
  console.error('error running scripts/release/homebrew.js', error)
  process.exit(1)
})
