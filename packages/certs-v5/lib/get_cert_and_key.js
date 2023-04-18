'use strict'

let cli = require('heroku-cli-util')

let readFile = require('./read_file.js')
let error = require('./error.js')

function usageError() {
  error.exit(1, 'Usage: heroku certs:add CRT KEY')
}

async function getFiles(context) {
  // eslint-disable-next-line no-return-await
  return await Promise.all(
    context.args.map(argument => readFile(argument, 'utf-8')),
  )
}

async function getFilesBypass(context) {
  if (context.args.length > 2) usageError()
  let files = await getFiles(context)
  return {crt: files[0], key: files[1]}
}

module.exports = async function (context) {
  if (context.args.length < 2) usageError()
  if (context.flags.bypass) {
    cli.warn('use of the --bypass flag is deprecated. The flag currently does not perform any additional behavior. Please remove --bypass')
  }

  // eslint-disable-next-line no-return-await
  return await getFilesBypass(context)
}
