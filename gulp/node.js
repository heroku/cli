'use strict';

let gulp   = require('gulp');
let gutil  = require('gulp-util');
let config = require('../config');
let fs     = require('fs-extra-promise');
let exists = require('mz/fs').exists;
let http   = require('./http');
let tar    = require('tar');
let zlib   = require('zlib');
let mkdirp = require('mkdirp');
let path   = require('path');
let os     = require('os');

exports.download = (file, platform, arch) => {
  if (arch === 'amd64') arch = 'x64';
  if (arch === '386')   arch = 'ia32';
  let base = `node-v${config.nodeVersion}-${platform}-${arch}`;
  let tmp = `./tmp/${base}`;
  return exists(tmp)
  .then(exists => {
    if (exists) return;
    gutil.log(`${tmp} not found, fetching`);
    return http.get(`https://nodejs.org/download/release/v${config.nodeVersion}/${base}.tar.gz`)
    .then(res => {
      return new Promise((ok, fail) => {
        res.pipe(zlib.createGunzip()).pipe(tar.Parse())
        .on('error', fail)
        .on('entry', entry => {
          if (entry.props.path === `${base}/bin/node`) {
            mkdirp.sync(path.dirname(tmp));
            entry.pipe(fs.createWriteStream(tmp).on('error', fail));
            entry.on('end', ok);
          }
        });
      });
    })
    .then(() => fs.chmod(tmp, 0o755));
  })
  .then(() => fs.copy(tmp, file));
};

gulp.task('build:workspace:node', () => exports.download(`./tmp/heroku/lib/node-${config.nodeVersion}`, os.platform(), os.arch()));
