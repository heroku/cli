import {Args, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import {flags, Command} from '@heroku-cli/command'
import * as  inquirer from 'inquirer'
import * as  path from 'path'
import * as os from 'os'
import * as fs from 'fs-extra'

function sshKeygen(file: string, quiet: boolean) {
  const spawn = require('child_process').spawn
  return new Promise(function (resolve, reject) {
    spawn('ssh-keygen', ['-o', '-t', 'rsa', '-N', '', '-f', file], {stdio: quiet ? null : 'inherit'})
      .on('close', (code: number) => code === 0 ? resolve(null) : reject(code))
  })
}

async function confirmPrompt(message: string) {
  if (process.stdin.isTTY) {
    return inquirer.prompt([{
      type: 'confirm',
      name: 'yes',
      message: message,
    }])
  }

  const data = await ux.prompt(message + ' [Y/n]')
  return {yes: /^y(es)?/i.test(data)}
}

export default class Add extends Command {
  static description = 'add an SSH key for a user'
  static help = 'if no KEY is specified, will try to find ~/.ssh/id_rsa.pub'
  static example = `$ heroku keys:add
Could not find an existing public key.
Would you like to generate one? [Yn] y
Generating new SSH public key.
Uploading SSH public key /.ssh/id_rsa.pub... done

$ heroku keys:add /my/key.pub
Uploading SSH public key /my/key.pub... done`

  static flags = {
    quiet: flags.boolean({hidden: true}),
    yes: flags.boolean({char: 'y', description: 'automatically answer yes for all prompts'}),
  }

  static args = {
    key: Args.string({description: 'absolute path to the key located on disk. If omitted, we use the default rsa key.'}),
  }

  async run() {
    const {flags, args} = await this.parse(Add)
    const sshdir = path.join(os.homedir(), '.ssh')

    const generate = async function () {
      await fs.ensureDir(sshdir, {mode: 0o700})
      await sshKeygen(path.join(sshdir, 'id_rsa'), flags.quiet)
    }

    const findKey = async function () {
      const defaultKeyPath = path.join(sshdir, 'id_rsa.pub')
      const defaultKeyExists = await fs.pathExists(defaultKeyPath)

      const keys = (await fs.readdir(sshdir))
        .map(k => path.join(sshdir, k))
        .filter(k => path.extname(k) === '.pub')

      if (!defaultKeyExists && keys.length === 0) {
        ux.warn('Could not find an existing SSH key at ' + path.join('~', '.ssh', 'id_rsa.pub'))

        if (!flags.yes) {
          const resp = await confirmPrompt('Would you like to generate a new one?')
          if (!resp.yes) return
        }

        await generate()
        return defaultKeyPath
      }

      if (keys.length === 1) {
        const key = keys[0]
        ux.log(`Found an SSH public key at ${color.cyan(key)}`)

        if (!flags.yes) {
          const resp = await confirmPrompt('Would you like to upload it to Heroku?')
          if (!resp.yes) return
        }

        return key
      }

      const resp = await inquirer.prompt([{
        type: 'list',
        name: 'key',
        choices: keys,
        message: 'Which SSH key would you like to upload?',
      }])
      return resp.key
    }

    let key = args.key
    if (!key) key = await findKey()
    if (!key) throw new Error('No key to upload')
    ux.action.start(`Uploading ${color.cyan(key)} SSH key`)
    const publicKey = await fs.readFile(key, {encoding: 'utf8'})
    await this.heroku.post('/account/keys', {
      body: {
        public_key: publicKey,
      },
    })
    ux.action.stop()
  }
}
