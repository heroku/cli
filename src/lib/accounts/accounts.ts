import {
  APIClient,
  getStorageConfig,
  listKeychainAccounts,
  writeLoginState,
} from '@heroku-cli/command'
import {removeAuth} from '@heroku-cli/command/lib/credential-manager.js'
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
  add(name: string, username: string, password: string): void
  current(heroku: APIClient): Promise<null | string>
  currentNetrc(): Promise<null | string>
  getStorageConfig(): ReturnType<typeof getStorageConfig>
  list(): Promise<AccountEntry[]>
  remove(name: string): void
  set(account: AccountEntry, dataDir: string): Promise<void>
  writeLoginState(dataDir: string, name: string): Promise<void>
}

export class AccountsWrapper implements IAccountsWrapper {
  private netrc: any

  add(name: string, username: string, password: string): void {
    const config = this.getStorageConfig()
    const basedir = path.join(this.configDir(), 'accounts')
    fs.mkdirSync(basedir, {recursive: true})

    if (config.credentialStore) {
      fs.writeFileSync(
        path.join(basedir, name),
        stringify({username}),
        'utf8',
      )
      fs.chmodSync(path.join(basedir, name), 0o600)
    }

    if (config.useNetrc) {
      fs.writeFileSync(
        path.join(basedir, name),
        // eslint-disable-next-line perfectionist/sort-objects
        stringify({username, password}),
        'utf8',
      )
      fs.chmodSync(path.join(basedir, name), 0o600)
    }
  }

  async current(heroku: APIClient): Promise<null | string> {
    const config = this.getStorageConfig()
    if (config.credentialStore) {
      const authEntry = await heroku.getAuthEntry()
      return authEntry?.account ?? null
    }

    return this.currentNetrc()
  }

  async currentNetrc(): Promise<null | string> {
    const netrcInstance = await this.initNetrc()
    if (netrcInstance.machines['api.heroku.com']) {
      const current = this.listNetrc().find(a => a.username === netrcInstance.machines['api.heroku.com'].login)
      return current && current.name ? current.name : null
    }

    return null
  }

  async getKeychainAccounts(): Promise<(null | string | undefined)[]> {
    return listKeychainAccounts()
  }

  getStorageConfig() {
    return getStorageConfig()
  }

  async list(): Promise<AccountEntry[]> {
    const config = this.getStorageConfig()
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

  async remove(name: string): Promise<void> {
    const config = this.getStorageConfig()
    if (config.credentialStore) {
      await removeAuth(name, ['api.heroku.com', 'git.heroku.com'])
    }

    const basedir = path.join(this.configDir(), 'accounts')
    fs.unlinkSync(path.join(basedir, name))
  }

  async set(account: AccountEntry, dataDir: string): Promise<void> {
    const config = this.getStorageConfig()
    if (config.credentialStore && !account.name) {
      await this.writeLoginState(dataDir, account.username)
      return
    }

    if (config.useNetrc && account.name) {
      const netrcInstance = await this.initNetrc()
      const current = this.account(account.name)
      netrcInstance.machines['git.heroku.com'] = {login: current.username, password: current.password}
      netrcInstance.machines['api.heroku.com'] = {login: current.username, password: current.password}
      await netrcInstance.save()
    }
  }

  async writeLoginState(dataDir: string, name: string): Promise<void> {
    return writeLoginState(dataDir, name)
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

  private getAliasEmail(alias: string): string | null {
    try {
      const basedir = path.join(this.configDir(), 'accounts')
      const filePath = path.join(basedir, alias)

      if (!fs.existsSync(filePath)) {
        return null
      }

      const file = fs.readFileSync(filePath, 'utf8')
      const account = parse(file)

      // Handle Ruby-style symbol keys for backward compatibility with legacy Ruby CLI
      if (account[':username']) {
        account.username = account[':username']
      }

      return account.username ?? null
    } catch {
      return null
    }
  }

  private configDir() {
    const legacyDir = path.join(os.homedir(), '.heroku')
    if (fs.existsSync(legacyDir)) {
      return legacyDir
    }

    return path.join(os.homedir(), '.config', 'heroku')
  }

  private async initNetrc() {
    if (!this.netrc) {
      const NetrcModule = await import('netrc-parser')
      const NetrcClass = (NetrcModule as any).Netrc || (NetrcModule as any).default.constructor
      this.netrc = new NetrcClass()
      await this.netrc.load()
    }

    return this.netrc
  }
}

// Default export for convenience
export default new AccountsWrapper()
