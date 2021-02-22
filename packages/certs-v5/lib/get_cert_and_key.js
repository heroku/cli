'use strict'

let readFile = require('./read_file.js')
let error = require('./error.js')
let sslDoctor = require('./ssl_doctor.js')

function usageError () {
  error.exit(1, 'Usage: heroku certs:add CRT KEY')
}

async function getFiles(context) {
  return await Promise.all(
    context.args.map((arg) => readFile(arg, 'utf-8'))
  );
}

async function getFilesBypass(context) {
  if (context.args.length > 2) usageError()
  let files = await getFiles(context)
  return {crt: files[0], key: files[1]}
}

async function getFilesDoctor(context) {
  let files = await getFiles(context)
  let res = JSON.parse(await sslDoctor('resolve-chain-and-key', files))
  return {crt: res.pem, key: res.key}
}

module.exports = async function (context) {
  if (context.args.length < 2) usageError()
  if (context.flags.bypass) {
    return await getFilesBypass(context);
  } else {
    return await getFilesDoctor(context);
  }
}
