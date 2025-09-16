import {parse, stringify} from 'yaml'
import * as fs from 'fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as Heroku from '@heroku-cli/schema'
import Netrc from 'netrc-parser'

function getAPIHostname(): string {
  const customApiUrl = process.env.HEROKU_API_URL
  if (customApiUrl) {
    try {
      return new URL(customApiUrl).hostname
    } catch {
      // If URL parsing fails, fall back to default
      return 'api.heroku.com'
    }
  }
  return 'api.heroku.com'
}

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

export function current(): string | null {
  const apiHost = getAPIHostname()
  if (Netrc.machines[apiHost]) {
    const current = list().find(a => a.username === Netrc.machines[apiHost].login)
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

export function set(name: string) {
  const current = account(name)
  const apiHost = getAPIHostname()
  Netrc.machines['git.heroku.com'] = {}
  Netrc.machines[apiHost] = {}
  Netrc.machines['git.heroku.com'].login = current.username
  Netrc.machines[apiHost].login = current.username
  Netrc.machines['git.heroku.com'].password = current.password
  Netrc.machines[apiHost].password = current.password

  Netrc.saveSync()
}
