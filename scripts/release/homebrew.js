#!/usr/bin/env node

const fs = require('fs')
const execa = require('execa')
const path = require('path')
const rm = require('rimraf')
const mkdirp = require('mkdirp')
const {promisify} = require('util')
const {pipeline} = require('stream')
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

async function calculateSHA256(fileName) {
  const hash = crypto.createHash('sha256')
  hash.setEncoding('hex')
  await promisify(pipeline)(fs.createReadStream(fileName), hash)
  return hash.read()
}

const ROOT = path.join(__dirname, 'homebrew')
const TEMPLATES = path.join(ROOT, 'templates')
const fileSuffix = '.tar.xz'
const ARCH_x64 = 'x64'
const ARCH_M1 = 'arm64'
const ARCH_ARM = 'arm'

function downloadFileFromS3(s3Path, fileName, downloadPath) {
  const downloadTo = path.join(downloadPath, fileName)
  const commandStr = `aws s3 cp s3://${HEROKU_S3_BUCKET}/${s3Path}/${fileName} ${downloadTo}`
  return execa.command(commandStr)
}

async function updateHerokuFormula(brewDir) {
  const templatePath = path.join(TEMPLATES, 'heroku.rb')
  const template = fs.readFileSync(templatePath).toString('utf-8')
  const formulaPath = path.join(brewDir, 'Formula', 'heroku.rb')

  const fileNamePrefix = `heroku-v${VERSION}-${GITHUB_SHA_SHORT}`
  const s3KeyPrefix = `versions/${VERSION}/${GITHUB_SHA_SHORT}`
  const urlPrefix = `https://cli-assets.heroku.com/${s3KeyPrefix}`

  const macFileNamePrefix = `${fileNamePrefix}-darwin-`
  const linuxFileNamePrefix = `${fileNamePrefix}-linux-`
  const macFileParts = [macFileNamePrefix, fileSuffix]
  const linuxFileParts = [linuxFileNamePrefix, fileSuffix]

  const fileName64Mac = macFileParts.join(ARCH_x64)
  const fileNameM1Mac = macFileParts.join(ARCH_M1)
  const fileNameLinux = linuxFileParts.join(ARCH_ARM)
  const fileName64Linux = linuxFileParts.join(ARCH_x64)

  // download files from S3 for SHA calc
  await Promise.all([
    downloadFileFromS3(s3KeyPrefix, fileName64Mac, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileNameM1Mac, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileNameLinux, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileName64Linux, __dirname),
  ])

  const sha256_64Mac = await calculateSHA256(path.join(__dirname, fileName64Mac))
  const sha256M1Mac = await calculateSHA256(path.join(__dirname, fileNameM1Mac))
  const sha256Linux = await calculateSHA256(path.join(__dirname, fileNameLinux))
  const sha256_64Linux = await calculateSHA256(path.join(__dirname, fileName64Linux))

  const templateReplaced =
    template
      .replace('__CLI_VERSION__', VERSION)
      .replace('__CLI_DOWNLOAD_URL__', `${urlPrefix}/${fileName64Mac}`)
      .replace('__CLI_SHA256__', sha256_64Mac)
      .replace('__CLI_DOWNLOAD_URL_M1__', `${urlPrefix}/${fileNameM1Mac}`)
      .replace('__CLI_SHA256_M1__', sha256M1Mac)
      .replace('__CLI_DOWNLOAD_URL_LINUX__', `${urlPrefix}/${fileNameLinux}`)
      .replace('__CLI_SHA256_LINUX__', sha256Linux)
      .replace('__CLI_DOWNLOAD_URL_LINUX_64__', `${urlPrefix}/${fileName64Linux}`)
      .replace('__CLI_SHA256_LINUX_64__', sha256_64Linux)

  fs.writeFileSync(formulaPath, templateReplaced)

  console.log(`done updating heroku Formula in ${formulaPath}`)
}

async function setupGit() {
  const githubSetupPath = path.join(__dirname, '..', 'utils', '_github_setup')
  await execa(githubSetupPath)
}

async function updateHomebrew() {
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

  await updateHerokuFormula(homebrewDir)

  // run in git in cloned heroku/homebrew-brew git directory
  const git = async (args, opts = {}) => {
    await execa('git', ['-C', homebrewDir, ...args], opts)
  }

  console.log('updating local git...')
  await git(['add', 'Formula'])
  await git(['config', '--local', 'core.pager', 'cat'])
  await git(['diff', '--cached'], {stdio: 'inherit'})
  await git(['commit', '-m', `heroku v${VERSION}`])
  if (process.env.SKIP_GIT_PUSH === undefined) {
    await git(['push', 'origin', 'master'])
  }
}

updateHomebrew().catch(error => {
  console.error('error running scripts/release/homebrew.js', error)
  process.exit(1)
})
