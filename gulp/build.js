'use strict'

let gulp = require('gulp')
let spawn = require('./spawn')
let fstream = require('fstream')
let tar = require('tar')
let fs = require('fs-extra-promise')
let lzma = require('lzma-native')
let mkdirp = require('mkdirp')
let path = require('path')
let node = require('./node')
let rimraf = require('rimraf')
let config = require('../config')
let exec = require('child_process').execSync

const VERSION = exec('./bin/version', {encoding: 'utf8'}).trim()
const REVISION = exec('git log -n 1 --pretty=format:"%H"', {encoding: 'utf8'}).trim()
// TODO: fix channel
const CHANNEL = 'dirty' ? 'dirty' : exec(`git rev-parse --abbrev-ref HEAD`, {encoding: 'utf8'}).trim()

function tarDirectory (dir, file) {
  return new Promise((ok, fail) => {
    mkdirp.sync(path.dirname(file))
    let packer = tar.Pack({noProprietary: true}).on('error', fail).on('end', ok)
    fstream.Reader({path: dir, type: 'Directory'}).on('error', fail)
      .pipe(packer)
      .pipe(lzma.createCompressor().on('error', fail))
      .pipe(fs.createWriteStream(file).on('error', fail))
  })
}

function build (opts) {
  let tmp = `./tmp/heroku-${opts.os}-${opts.arch}`
  let ldflags = `-X=main.Version=${VERSION} -X=main.Channel=${CHANNEL} -X=main.GitSHA=${REVISION}`
  return spawn('go', ['build', '-o', `${tmp}/bin/heroku`, '-ldflags', ldflags], {env: {
      GOOS: opts.os,
      GOARCH: opts.arch,
  }})
    .then(() => fs.copy('./tmp/heroku/lib', `${tmp}/lib`))
    .then(() => node.download(`${tmp}/lib/node-${config.nodeVersion}`, opts.os, opts.arch))
    .then(() => tarDirectory(tmp, `./dist/heroku-${opts.os}-${opts.arch}.tar.xz`))
}

gulp.task('build:darwin-amd64', ['build:coreplugins'], () => build({os: 'darwin', arch: 'amd64'}))
gulp.task('build:linux-amd64', ['build:coreplugins'], () => build({os: 'linux',  arch: 'amd64'}))

gulp.task('build:workspace', ['build:workspace:npm', 'build:workspace:node', 'build:workspace:cli'])
gulp.task('build:workspace:cli', [], () => spawn('go', ['build', '-o', './tmp/heroku/bin/heroku']))

gulp.task('build', [
  'build:darwin-amd64',
  'build:linux-amd64',
])

gulp.task('clean', () => {
  rimraf.sync('./dist'); rimraf.sync('./tmp');})
