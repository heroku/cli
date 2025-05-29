import {parse, stringify} from 'yaml'
import * as fs from 'fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as Heroku from '@heroku-cli/schema'
import netrc from 'netrc-parser'

function configDir() {
  const legacyDir = path.join(os.homedir(), '.heroku')
  if (fs.existsSync(legacyDir)) {
    return legacyDir
  }

  return path.join(os.homedir(), '.config', 'heroku')
}

function account(name: string): Heroku.Account {
  const basedir = path.join(configDir(), 'accounts')
  const file = fs.readFileSync(path.join(basedir, name), 'utf8')
  const account = parse(file)
  if (account[':username']) {
    // convert from ruby symbols
    account.username = account[':username']
    account.password = account[':password']
    delete account[':username']
    delete account[':password']
  }

  return account
}

export function list(): Heroku.Account[] | [] {
  const basedir = path.join(configDir(), 'accounts')
  try {
    return fs.readdirSync(basedir)
      .map(name => Object.assign(account(name), {name}))
  } catch {
    return []
  }
}

export async function current(): Promise<string | null> {
  await netrc.load()
  if (netrc.machines['api.heroku.com']) {
    const current = list().find(a => a.username === netrc.machines['api.heroku.com'].login)
    return current && current.name ? current.name : null
  }

  return null
}

export function add(name: string, username: string, password: string) {
  const basedir = path.join(configDir(), 'accounts')
  fs.mkdirSync(basedir, {recursive: true})

  fs.writeFileSync(
    path.join(basedir, name),
    stringify({username, password}),
    'utf8',
  )
  fs.chmodSync(path.join(basedir, name), 0o600)
}

export function remove(name: string) {
  const basedir = path.join(configDir(), 'accounts')
  fs.unlinkSync(path.join(basedir, name))
}

export async function set(name: string) {
  await netrc.load()
  const current = account(name)
  netrc.machines['git.heroku.com'] = {login: current.username, password: current.password}
  netrc.machines['api.heroku.com'] = {login: current.username, password: current.password}
  await netrc.save()
}
