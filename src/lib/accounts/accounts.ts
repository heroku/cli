import {APIClient, listKeychainAccounts, getStorageConfig} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {parse, stringify} from 'yaml'

export interface AccountEntry {
  name?: string
  username: string
}

export interface IAccountsWrapper {
  list(): Promise<AccountEntry[]>
  current(heroku: APIClient): Promise<string | null>
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

  async getKeychainAccounts(): Promise<(string | null | undefined)[]> {
    return listKeychainAccounts()
  }

  async list(): Promise<AccountEntry[]> {
    const config = getStorageConfig()
    if (config.credentialStore) {
      const accounts = await this.getKeychainAccounts()
      return accounts
        .filter((account): account is string => account !== null && account !== undefined)
        .map(account => ({username: account}))
    }

    return this.listNetrc()
  }

  listNetrc(): AccountEntry[] {
    const basedir = path.join(this.configDir(), 'accounts')
    try {
      return fs.readdirSync(basedir)
        .map(name => ({name, username: this.account(name).username ?? ''}))
    } catch {
      return []
    }
  }

  async current(heroku: APIClient): Promise<string | null> {
    const config = getStorageConfig()
    if (config.credentialStore) {
      const authEntry = await heroku.getAuthEntry()
      return authEntry?.account ?? null
    }

    const netrcInstance = await this.initNetrc()
    if (netrcInstance.machines['api.heroku.com']) {
      const current = this.listNetrc().find(a => a.username === netrcInstance.machines['api.heroku.com'].login)
      return current?.name ?? null
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
