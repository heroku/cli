#!/usr/bin/env node

const fs = require('fs')
const execa = require('execa')
const path = require('path')
const rm = require('rimraf')
const mkdirp = require('mkdirp')
const { promisify } = require('util')
const { pipeline } = require('stream')
const crypto = require('crypto')
const getHerokuS3Bucket = require('../utils/getHerokuS3Bucket')
const isStableRelease = require('../utils/isStableRelease')

const {GITHUB_SHA_SHORT, GITHUB_REF_TYPE, GITHUB_REF_NAME} = process.env
const HEROKU_S3_BUCKET = getHerokuS3Bucket()
const VERSION = require(path.join(__dirname, '..', '..', 'packages', 'cli', 'package.json')).version

if (!isStableRelease(GITHUB_REF_TYPE, GITHUB_REF_NAME)) {
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

function downloadFileFromS3(s3Path, fileName, downloadPath) {
  const downloadTo = path.join(downloadPath, fileName)
  const commandStr = `aws s3 cp s3://${HEROKU_S3_BUCKET}/${s3Path}/${fileName} ${downloadTo}`
  return execa.command(commandStr)
}

async function updateHerokuFormula (brewDir) {
  const templatePath = path.join(TEMPLATES, 'heroku.rb')
  const template = fs.readFileSync(templatePath).toString('utf-8')
  const formulaPath = path.join(brewDir, 'Formula', 'heroku.rb')

  // todo: support both Linux architectures that oclif does
  const fileNamePrefix = `heroku-v${VERSION}-${GITHUB_SHA_SHORT}`
  const s3KeyPrefix = `versions/${VERSION}/${GITHUB_SHA_SHORT}`
  const urlPrefix = `https://cli-assets.heroku.com/${s3KeyPrefix}`

  const fileNameMacIntel = `${fileNamePrefix}-darwin-${INTEL_ARCH}${fileSuffix}`
  const fileNameMacM1 = `${fileNamePrefix}-darwin-${M1_ARCH}${fileSuffix}`
  const fileNameLinuxIntel = `${fileNamePrefix}-linux-${INTEL_ARCH}${fileSuffix}`
  const fileNameLinuxArm = `${fileNamePrefix}-linux-arm${fileSuffix}`

  // download files from S3 for SHA calc
  await Promise.all([
    downloadFileFromS3(s3KeyPrefix, fileNameMacIntel, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileNameMacM1, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileNameLinuxIntel, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileNameLinuxArm, __dirname),
  ])

  const sha256MacIntel = await calculateSHA256(path.join(__dirname, fileNameMacIntel))
  const sha256MacM1 = await calculateSHA256(path.join(__dirname, fileNameMacM1))
  const sha256LinuxIntel = await calculateSHA256(path.join(__dirname, fileNameLinuxIntel))
  const sha256LinuxArm = await calculateSHA256(path.join(__dirname, fileNameLinuxArm))

  const templateReplaced =
    template
      .replace('__CLI_MAC_DOWNLOAD_URL__', `${urlPrefix}/${fileNameMacIntel}`)
      .replace('__CLI_MAC_M1_DOWNLOAD_URL__', `${urlPrefix}/${fileNameMacM1}`)
      .replace('__CLI_MAC_SHA256__', sha256MacIntel)
      .replace('__CLI_MAC_M1_SHA256__', sha256MacM1)
      .replace('__CLI_LINUX_DOWNLOAD_URL__', `${urlPrefix}/${fileNameLinuxIntel}`)
      .replace('__CLI_LINUX_ARM_DOWNLOAD_URL__', `${urlPrefix}/${fileNameLinuxArm}`)
      .replace('__CLI_LINUX_SHA256__', sha256LinuxIntel)
      .replace('__CLI_LINUX_ARM_SHA256__', sha256LinuxArm)
      .replace('__CLI_VERSION__', VERSION)

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

  await updateHerokuFormula(homebrewDir)

  // run in git in cloned heroku/homebrew-brew git directory
  const git = async (args, opts = {}) => {
    await execa('git', ['-C', homebrewDir, ...args], opts)
  }

  console.log('updating local git...')
  await git(['add', 'Formula'])
  await git(['config', '--local', 'core.pager', 'cat'])
  await git(['diff', '--cached'], { stdio: 'inherit' })
  await git(['commit', '-m', `heroku v${VERSION}`])
  if (process.env.SKIP_GIT_PUSH === undefined) {
    await git(['push', 'origin', 'master'])
  }
}

updateHomebrew().catch((err) => {
  console.error(`error running scripts/release/homebrew.js`, err)
  process.exit(1)
})
