#!/usr/bin/env node

const fs = require('fs')
const execa = require('execa')
const https = require('https')
const path = require('path')
const rm = require('rimraf')
const mkdirp = require('mkdirp')
const { promisify } = require('util')
const { pipeline } = require('stream')
const crypto = require('crypto')

const NODE_JS_BASE = 'https://nodejs.org/download/release'
const CLI_DIR = path.join(__dirname, '..', '..', 'packages', 'cli')
const DIST_DIR = path.join(CLI_DIR, 'dist')
const PJSON = require(path.join(CLI_DIR, 'package.json'))
const NODE_VERSION = PJSON.oclif.update.node.version
const SHORT_VERSION = PJSON.version

async function getText (url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let buffer = []

      res.on('data', (buf) => {
        buffer.push(buf)
      })

      res.on('close', () => {
        resolve(Buffer.concat(buffer).toString('utf-8'))
      })
    }).on('error', reject)
  })
}

async function getDownloadInfoForNodeVersion (version) {
  // https://nodejs.org/download/release/v12.21.0/SHASUMS256.txt
  const url = `${NODE_JS_BASE}/v${version}/SHASUMS256.txt`
  const shasums = await getText(url)
  const shasumLine = shasums.split('\n').find((line) => {
    return line.includes(`node-v${version}-darwin-x64.tar.xz`)
  })

  if (!shasumLine) {
    throw new Error(`could not find matching shasum for ${version}`)
  }

  const [shasum, filename] = shasumLine.trim().split(/\s+/)
  return {
    url: `${NODE_JS_BASE}/v${version}/${filename}`,
    sha256: shasum
  }
}

if (!process.env.GITHUB_REF_NAME.startsWith('release-')) {
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

const CLI_ASSETS_URL = process.env.CLI_ASSETS_URL || 'https://cli-assets.heroku.com'

async function updateHerokuFormula (brewDir) {
  const templatePath = path.join(TEMPLATES, 'heroku.rb')
  const template = fs.readFileSync(templatePath).toString('utf-8')

  const pathToDist = path.join(DIST_DIR, `heroku-v${SHORT_VERSION}`, `heroku-v${SHORT_VERSION}.tar.xz`)
  const sha256 = await calculateSHA256(pathToDist)
  const url = `${CLI_ASSETS_URL}/heroku-v${SHORT_VERSION}/heroku-v${SHORT_VERSION}.tar.xz`

  const templateReplaced =
    template
      .replace('__CLI_DOWNLOAD_URL__', url)
      .replace('__CLI_SHA256__', sha256)
      .replace('__NODE_VERSION__', NODE_VERSION)

  fs.writeFileSync(path.join(brewDir, 'Formula', 'heroku.rb'), templateReplaced)
}

async function updateHerokuNodeFormula (brewDir) {
  const formulaPath = path.join(brewDir, 'Formula', 'heroku-node.rb')

  console.log(`updating heroku-node Formula in ${formulaPath}`)
  console.log(`getting SHA and URL for Node.js version ${NODE_VERSION}`)

  const { url, sha256 } = await getDownloadInfoForNodeVersion(NODE_VERSION)

  console.log(`done getting SHA for Node.js version ${NODE_VERSION}: ${sha256}`)
  console.log(`done getting URL for Node.js version ${NODE_VERSION}: ${url}`)

  const templatePath = path.join(TEMPLATES, 'heroku-node.rb')
  const template = fs.readFileSync(templatePath).toString('utf-8')

  const templateReplaced =
    template
      .replace('__NODE_BIN_URL__', url)
      .replace('__NODE_SHA256__', sha256)
      .replace('__NODE_VERSION__', NODE_VERSION)

  fs.writeFileSync(formulaPath, templateReplaced)
  console.log(`done updating heroku-node Formula in ${formulaPath}`)
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
  await updateHerokuNodeFormula(homebrewDir)
  await updateHerokuFormula(homebrewDir)

  // run in git in cloned heroku/homebrew-brew git directory
  const git = async (args, opts = {}) => {
    await execa('git', ['-C', homebrewDir, ...args], opts)
  }

  await git(['add', 'Formula'])
  await git(['config', '--local', 'core.pager', 'cat'])
  await git(['diff', '--cached'], { stdio: 'inherit' })
  await git(['commit', '-m', `heroku v${SHORT_VERSION}`])
  if (process.env.SKIP_GIT_PUSH === undefined) {
    await git(['push', 'origin', 'main'])
  }
}

updateHomebrew().catch((err) => {
  console.error(`error running scripts/release/homebrew.js`, err)
  process.exit(1)
})
