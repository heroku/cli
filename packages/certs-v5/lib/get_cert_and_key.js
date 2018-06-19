'use strict'

let readFile = require('./read_file.js')
let error = require('./error.js')
let sslDoctor = require('./ssl_doctor.js')

function usageError () {
  error.exit(1, 'Usage: heroku certs:add CRT KEY')
}

function * getFiles (context) {
  return yield context.args.map((arg) => readFile(arg, 'utf-8'))
}

function * getFilesBypass (context) {
  if (context.args.length > 2) usageError()
  let files = yield getFiles(context)
  return {crt: files[0], key: files[1]}
}

function * getFilesDoctor (context) {
  let files = yield getFiles(context)
  let res = JSON.parse(yield sslDoctor('resolve-chain-and-key', files))
  return {crt: res.pem, key: res.key}
}

module.exports = function * (context) {
  if (context.args.length < 2) usageError()
  if (context.flags.bypass) {
    return yield getFilesBypass(context)
  } else {
    return yield getFilesDoctor(context)
  }
}
