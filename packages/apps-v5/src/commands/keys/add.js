'use strict'

const cli = require('heroku-cli-util')
const os = require('os')
const fs = require('fs-extra')

function sshKeygen (file, quiet) {
  let spawn = require('child_process').spawn
  return new Promise(function (resolve, reject) {
    spawn('ssh-keygen', ['-o', '-t', 'rsa', '-N', '', '-f', file], { stdio: quiet ? null : 'inherit' })
      .on('close', (code) => code === 0 ? resolve() : reject(code))
  })
}

async function run (context, heroku) {
  const inquirer = require('inquirer')
  function confirmPrompt (message) {
    if (process.stdin.isTTY) {
      return inquirer.prompt([{
        type: 'confirm',
        name: 'yes',
        message: message
      }])
    } else {
      return cli.prompt(message + ' [Y/n]').then(function (data) {
        return { yes: /^y(es)?/i.test(data) }
      })
    }
  }

  let path = require('path')

  const sshdir = path.join(os.homedir(), '.ssh')

  let generate = async function () {
    await fs.mkdirp(sshdir, { mode: 0o700 })
    await sshKeygen(path.join(sshdir, 'id_rsa'), context.flags.quiet)
  }

  let findKey = async function () {
    const defaultKey = path.join(sshdir, 'id_rsa.pub')
    if (!(await fs.pathExists(defaultKey))) {
      cli.console.error('Could not find an existing SSH key at ' + path.join('~', '.ssh', 'id_rsa.pub'))

      if (!context.flags.yes) {
        let resp = await confirmPrompt('Would you like to generate a new one?')
        if (!resp.yes) return
      }

      await generate()
      return defaultKey
    }
    let keys = await fs.readdir(sshdir)
    keys = keys.map((k) => path.join(sshdir, k))
    keys = keys.filter((k) => path.extname(k) === '.pub')
    if (keys.length === 1) {
      let key = keys[0]
      cli.console.error(`Found an SSH public key at ${cli.color.cyan(key)}`)

      if (!context.flags.yes) {
        let resp = await confirmPrompt('Would you like to upload it to Heroku?')
        if (!resp.yes) return
      }

      return key
    } else {
      let resp = await inquirer.prompt([{
        type: 'list',
        name: 'key',
        choices: keys,
        message: 'Which SSH key would you like to upload?'
      }])
      return resp.key
    }
  }

  let upload = async function (key) {
    await cli.action(`Uploading ${cli.color.cyan(key)} SSH key`, (async () => {
      await heroku.post('/account/keys', {
        body: {
          public_key: await fs.readFile(key, 'utf8')
        }
      })
    })())
  }

  let key = context.args.key
  if (!key) key = await findKey()
  if (!key) throw new Error('No key to upload')
  await upload(key)
}

module.exports = {
  topic: 'keys',
  command: 'add',
  description: 'add an SSH key for a user',
  help: `if no KEY is specified, will try to find ~/.ssh/id_rsa.pub`,
  examples: `$ heroku keys:add
Could not find an existing public key.
Would you like to generate one? [Yn] y
Generating new SSH public key.
Uploading SSH public key /.ssh/id_rsa.pub... done

$ heroku keys:add /my/key.pub
Uploading SSH public key /my/key.pub... done`,
  needsAuth: true,
  args: [{ name: 'key', optional: true }],
  flags: [
    { name: 'quiet', hidden: true },
    { name: 'yes', char: 'y', description: 'automatically answer yes for all prompts' }
  ],
  run: cli.command(run)
}
