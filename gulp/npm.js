'use strict';

let gulp     = require('gulp');
let gutil    = require('gulp-util');
let fs       = require('mz/fs');
let config   = require('../config.json');
let http     = require('./http');
let zlib     = require('zlib');
let tar      = require('tar');

const npmPath = `./tmp/heroku/lib/npm-${config.npmVersion}`;

gulp.task('build:workspace:npm', () => {
  return fs.exists(npmPath)
  .then(exists => {
    if (exists) return;
    gutil.log(`${npmPath} not found, fetching`);
    return http.get(`https://github.com/npm/npm/archive/v${config.npmVersion}.tar.gz`)
    .then(res => {
      return new Promise((ok, fail) => {
        let gunzip = zlib.createGunzip().on('error', fail);
        let extractor = tar.Extract({path: './tmp/heroku/lib'}).on('error', fail).on('end', ok);
        res.pipe(gunzip).pipe(extractor);
      });
    });
  });
});
