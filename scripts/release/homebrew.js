
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
const ARCH_INTEL = 'x64'
const ARCH_ARM = 'arm64'

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

  const fileNameMacIntel = `${fileNamePrefix}-darwin-${ARCH_INTEL}${fileSuffix}`
  const fileNameMacArm = `${fileNamePrefix}-darwin-${ARCH_ARM}${fileSuffix}`
  const fileNameLinuxIntel = `${fileNamePrefix}-linux-${ARCH_INTEL}${fileSuffix}`
  const fileNameLinuxArm = `${fileNamePrefix}-linux-arm${fileSuffix}`

  // download files from S3 for SHA calc
  await Promise.all([
    downloadFileFromS3(s3KeyPrefix, fileNameMacArm, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileNameMacArm, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileNameLinuxIntel, __dirname),
    downloadFileFromS3(s3KeyPrefix, fileNameLinuxArm, __dirname),
  ])

  const sha256MacIntel = await calculateSHA256(path.join(__dirname, fileNameMacIntel))
  const sha256MacArm = await calculateSHA256(path.join(__dirname, fileNameMacArm))
  const sha256LinuxIntel = await calculateSHA256(path.join(__dirname, fileNameLinuxIntel))
  const sha256LinuxArm = await calculateSHA256(path.join(__dirname, fileNameLinuxArm))

  const templateReplaced =
    template
      .replace('__CLI_VERSION__', VERSION)

      .replace('__CLI_MAC_INTEL_DOWNLOAD_URL__', `${urlPrefix}/${fileNameMacIntel}`)
      .replace('__CLI_MAC_INTEL_SHA256__', sha256MacIntel)

      .replace('__CLI_MAC_ARM_DOWNLOAD_URL__', `${urlPrefix}/${fileNameMacArm}`)
      .replace('__CLI_MAC_ARM_SHA256__', sha256MacArm)

      .replace('__CLI_LINUX_DOWNLOAD_URL__', `${urlPrefix}/${fileNameLinuxIntel}`)
      .replace('__CLI_LINUX_SHA256__', sha256LinuxIntel)

      .replace('__CLI_LINUX_ARM_DOWNLOAD_URL__', `${urlPrefix}/${fileNameLinuxArm}`)
      .replace('__CLI_LINUX_ARM_SHA256__', sha256LinuxArm)

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
