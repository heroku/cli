'use strict'

let readFile = require('./read_file.js')
let error = require('./error.js')

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

module.exports = async function (context) {
  if (context.args.length < 2) usageError()
  if (context.flags.bypass) {
    cli.warn('use of the --bypass flag is deprecated. The flag currently does not perform any additional behavior. Please remove --bypass')
  }

  return await getFilesBypass(context);
}
