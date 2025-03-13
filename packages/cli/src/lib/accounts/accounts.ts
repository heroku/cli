import {parse, stringify} from 'yaml'
import * as fs from 'fs'
import * as os from 'node:os'
import * as path from 'node:path'
import netrc, {Netrc} from 'netrc-parser'

function configDir() {
  const legacyDir = path.join(os.homedir(), '.heroku')
  if (fs.existsSync(legacyDir)) {
    return legacyDir
  }

  return path.join(os.homedir(), '.config', 'heroku')
}

function account(name: string) {
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

export function list() {
  const basedir = path.join(configDir(), 'accounts')
  try {
    return fs.readdirSync(basedir)
      .map(name => Object.assign(account(name), {name}))
  } catch {
    return []
  }
}

export function current() {
  const netrcFile: Netrc = netrc.loadSync() as unknown as Netrc
  if (netrcFile.machines['api.heroku.com']) {
    const current = list().find(a => a.username === netrcFile.machines['api.heroku.com'].login)
    return current ? current.name : null
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
  const netrcFile: Netrc = netrc.loadSync() as unknown as Netrc
  const current = account(name)
  netrcFile.machines['git.heroku.com'] = {}
  netrcFile.machines['api.heroku.com'] = {}
  netrcFile.machines['git.heroku.com'].login = current.username
  netrcFile.machines['api.heroku.com'].login = current.username
  netrcFile.machines['git.heroku.com'].password = current.password
  netrcFile.machines['api.heroku.com'].password = current.password

  netrcFile.saveSync()
}
