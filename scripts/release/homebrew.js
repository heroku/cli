#!/usr/bin/env node

const fs = require('fs')
const execa = require('execa')
const path = require('path')
const rm = require('rimraf')
const mkdirp = require('mkdirp')
const { promisify } = require('util')
const { pipeline } = require('stream')
const crypto = require('crypto')

const CLI_DIR = path.join(__dirname, '..', '..', 'packages', 'cli')
const DIST_DIR = path.join(CLI_DIR, 'dist')
const {GITHUB_SHA_SHORT, VERSION} = process.env

if (!(process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME.startsWith('v'))) {
  console.log('Not on stable release; skipping releasing homebrew')
  process.exit(0)
}

async function calculateSHA256 (fileName) {
  const hash = crypto.createHash('sha256')
  hash.setEncoding('hex')
  await promisify(pipeline)(fs.createReadStream(fileName), hash)
  return hash.read()
}

const ROOT = path.join(__dirname, 'homebrew')
const TEMPLATES = path.join(ROOT, 'templates')
const fileSuffix = '.tar.xz'
const INTEL_ARCH = 'x64'
const M1_ARCH = 'arm64'

async function updateHerokuFormula (brewDir) {
  const templatePath = path.join(TEMPLATES, 'heroku.rb')
  const template = fs.readFileSync(templatePath).toString('utf-8')
  const formulaPath = path.join(brewDir, 'Formula', 'heroku.rb')

  // todo: support both Linux architectures that oclif does
  const fileNamePrefix = `heroku-v${VERSION}-${GITHUB_SHA_SHORT}-darwin-`
  const urlPrefix = `https://cli-assets.heroku.com/versions/${VERSION}/${GITHUB_SHA_SHORT}/`
  const fileParts = [fileNamePrefix, fileSuffix]

  const fileNameIntel = fileParts.join(INTEL_ARCH)
  const sha256Intel = await calculateSHA256(path.join(DIST_DIR, fileNameIntel))
  const fileNameM1 = fileParts.join(M1_ARCH)
  const sha256M1 = await calculateSHA256(path.join(DIST_DIR, fileNameM1))

  const templateReplaced =
    template
      .replace('__CLI_DOWNLOAD_URL__', `${urlPrefix}${fileNameIntel}`)
      .replace('__CLI_DOWNLOAD_URL_M1__', `${urlPrefix}${fileNameM1}`)
      .replace('__CLI_SHA256__', sha256Intel)
      .replace('__CLI_SHA256_M1__', sha256M1)

  // console.log(templateReplaced)
  fs.writeFileSync(formulaPath, templateReplaced)

  console.log(`done updating heroku Formula in ${formulaPath}`)
}

async function setupGit () {
  const githubSetupPath = path.join(__dirname, '..', 'utils', '_github_setup')
  await execa(githubSetupPath)
}

async function updateHomebrew () {
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
      homebrewDir
    ]
  )
  console.log(`done cloning heroku/homebrew-brew to ${homebrewDir}`)

  console.log('updating local git...')
  await updateHerokuFormula(homebrewDir)

  // run in git in cloned heroku/homebrew-brew git directory
  const git = async (args, opts = {}) => {
    await execa('git', ['-C', homebrewDir, ...args], opts)
  }

  await git(['add', 'Formula'])
  await git(['config', '--local', 'core.pager', 'cat'])
  await git(['diff', '--cached'], { stdio: 'inherit' })
  await git(['commit', '-m', `heroku v${VERSION}`])
  if (process.env.SKIP_GIT_PUSH === undefined) {
    await git(['push', 'origin', 'main'])
  }
}

updateHomebrew().catch((err) => {
  console.error(`error running scripts/release/homebrew.js`, err)
  process.exit(1)
})
