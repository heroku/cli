import {parse, stringify} from 'yaml'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as Heroku from '@heroku-cli/schema'

export interface IAccountsWrapper {
  list(): Heroku.Account[] | []
  current(): Promise<string | null>
  add(name: string, username: string, password: string): void
  remove(name: string): void
  set(name: string): Promise<void>
}

export class AccountsWrapper implements IAccountsWrapper {
  private netrc: any

  private async initNetrc() {
    if (!this.netrc) {
      const NetrcModule = await import('netrc-parser')
      const NetrcClass = (NetrcModule as any).Netrc || (NetrcModule as any).default.constructor
      this.netrc = new NetrcClass()
      await this.netrc.load()
    }

    return this.netrc
  }

  private configDir() {
    const legacyDir = path.join(os.homedir(), '.heroku')
    if (fs.existsSync(legacyDir)) {
      return legacyDir
    }

    return path.join(os.homedir(), '.config', 'heroku')
  }

  private account(name: string): Heroku.Account {
    const basedir = path.join(this.configDir(), 'accounts')
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

  list(): Heroku.Account[] | [] {
    const basedir = path.join(this.configDir(), 'accounts')
    try {
      return fs.readdirSync(basedir)
        .map(name => Object.assign(this.account(name), {name}))
    } catch {
      return []
    }
  }

  async current(): Promise<string | null> {
    const netrcInstance = await this.initNetrc()
    if (netrcInstance.machines['api.heroku.com']) {
      const current = this.list().find(a => a.username === netrcInstance.machines['api.heroku.com'].login)
      return current && current.name ? current.name : null
    }

    return null
  }

  add(name: string, username: string, password: string): void {
    const basedir = path.join(this.configDir(), 'accounts')
    fs.mkdirSync(basedir, {recursive: true})

    fs.writeFileSync(
      path.join(basedir, name),
      stringify({username, password}),
      'utf8',
    )
    fs.chmodSync(path.join(basedir, name), 0o600)
  }

  remove(name: string): void {
    const basedir = path.join(this.configDir(), 'accounts')
    fs.unlinkSync(path.join(basedir, name))
  }

  async set(name: string): Promise<void> {
    const netrcInstance = await this.initNetrc()
    const current = this.account(name)
    netrcInstance.machines['git.heroku.com'] = {login: current.username, password: current.password}
    netrcInstance.machines['api.heroku.com'] = {login: current.username, password: current.password}
    await netrcInstance.save()
  }
}

// Default export for convenience
export default new AccountsWrapper()
