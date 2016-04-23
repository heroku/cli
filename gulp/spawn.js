'use strict'

let spawn = require('child_process').spawn
let gutil = require('gulp-util')

module.exports = (cmd, args, opts) => {
  return new Promise((ok, fail) => {
    gutil.log(`> ${cmd} ${args.join(' ')}`)
    opts = Object.assign({stdio: 'inherit'}, opts)
    opts.env = Object.assign({}, process.env, opts.env)
    spawn(cmd, args, opts)
      .on('error', fail)
      .on('close', code => code === 0 ? ok() : fail(`${cmd} ${args.join(' ')} exit code: ${code}`))
  })
}
