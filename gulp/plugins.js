'use strict'

let gulp = require('gulp')
let fs = require('mz/fs')
let spawn = require('./spawn')
let config = require('../config.json')

const workspace = './tmp/heroku'

gulp.task('build:coreplugins', ['build:workspace'], () => {
  fs.writeFileSync(workspace + '/lib/package.json', JSON.stringify(config.pjson, null, 2), 'utf8')
  return spawn('./bin/heroku', ['setup'], {cwd: workspace})
})
