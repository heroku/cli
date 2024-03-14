'use strict'

let childProcess = require('child_process')

module.exports = {
  spawn: function (args) {
    return new Promise(function (resolve, reject) {
      let s = childProcess.spawn('openssl', args, {stdio: 'inherit'})
      s.on('error', reject)
      s.on('close', function (code) {
        if (code === 0) {
          resolve(code)
        } else {
          reject(new Error(`Non zero openssl error ${code}`))
        }
      })
    })
  },
}
