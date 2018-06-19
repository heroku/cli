'use strict'

const {fork} = require('child_process')
const path = require('path')

module.exports = function (argv) {
  let script = path.join(__dirname, 'run_foreman.js')
  let nf = fork(script, argv, {stdio: 'inherit'})
  return new Promise((resolve, reject) => {
    nf.on('exit', function (code) {
      if (code !== 0) process.exit(code)
      resolve()
    })
  })
}
