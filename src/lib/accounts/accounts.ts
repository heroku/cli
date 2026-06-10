import {
  APIClient,
  getStorageConfig,
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
  list(): AccountEntry[]
  remove(name: string): void
  set(account: AccountEntry, dataDir: string): Promise<void>
  writeLoginState(dataDir: string, name: string): Promise<void>
}

export class AccountsWrapper implements IAccountsWrapper {
  private netrc: any

  add(name: string, username: string, password: string): void {
    fs.mkdirSync(this.accountsDir(), {recursive: true})

    // eslint-disable-next-line perfectionist/sort-objects
    this.writeAccountFile(name, {username, password})
  }

  async current(heroku: APIClient): Promise<null | string> {
    const config = this.getStorageConfig()
    if (config.credentialStore) {
      const authEntry = await heroku.getAuthEntry()
      const current = this.list().find(a => a.username === authEntry?.account)
      return current && current.name ? current.name : null
    }

    return this.currentNetrc()
  }

  async currentNetrc(): Promise<null | string> {
    const netrcInstance = await this.initNetrc()
    if (netrcInstance.machines['api.heroku.com']) {
      const current = this.list().find(a => a.username === netrcInstance.machines['api.heroku.com'].login)
      return current && current.name ? current.name : null
    }

    return null
  }

  getStorageConfig() {
    return getStorageConfig()
  }

  list(): AccountEntry[] {
    const basedir = this.accountsDir()
    try {
      return fs.readdirSync(basedir)
        .filter(name => this.account(name).username)
        .map(name => ({name, username: this.account(name).username}))
    } catch {
      return []
    }
  }

  async remove(name: string): Promise<void> {
    const config = this.getStorageConfig()

    if (config.credentialStore) {
      // Keychain mode
      const email = this.getAliasEmail(name)
      await removeAuth(email, ['api.heroku.com', 'git.heroku.com'])
      fs.unlinkSync(path.join(this.accountsDir(), name))
      return
    }

    // Netrc mode
    fs.unlinkSync(path.join(this.accountsDir(), name))
  }

  async set(account: AccountEntry, dataDir: string): Promise<void> {
    const config = this.getStorageConfig()

    if (config.credentialStore) {
      if (account.name) {
        // Aliased keychain account: read email from alias file
        const email = this.getAliasEmail(account.name)
        if (email) {
          await this.writeLoginState(dataDir, email)
          return
        }

        throw new Error(`We can't find the alias file for ${account.name}.`)
      } else {
        // Non-aliased account: use username directly
        await this.writeLoginState(dataDir, account.username)
        return
      }
    }

    if (config.useNetrc && account.name) {
      const netrcInstance = await this.initNetrc()
      const current = this.account(account.name)
      netrcInstance.machines['git.heroku.com'] = {login: current.username, password: current.password || ''}
      netrcInstance.machines['api.heroku.com'] = {login: current.username, password: current.password || ''}
      await netrcInstance.save()
    }
  }

  async writeLoginState(dataDir: string, name: string): Promise<void> {
    return writeLoginState(dataDir, name)
  }

  private account(name: string): Heroku.Account {
    const file = fs.readFileSync(path.join(this.accountsDir(), name), 'utf8')
    const account = parse(file)
    this.convertRubySymbols(account)
    return account
  }

  private accountsDir(): string {
    return path.join(this.configDir(), 'accounts')
  }

  private configDir() {
    const legacyDir = path.join(os.homedir(), '.heroku')
    if (fs.existsSync(legacyDir)) {
      return legacyDir
    }

    return path.join(os.homedir(), '.config', 'heroku')
  }

  private convertRubySymbols(account: any): void {
    if (account[':username']) {
      account.username = account[':username']
      account.password = account[':password']
      delete account[':username']
      delete account[':password']
    }
  }

  private getAliasEmail(alias: string): string | undefined {
    try {
      const filePath = path.join(this.accountsDir(), alias)

      if (!fs.existsSync(filePath)) {
        return
      }

      const file = fs.readFileSync(filePath, 'utf8')
      const account = parse(file)
      this.convertRubySymbols(account)

      return account.username ?? undefined
    } catch {
      return undefined
    }
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

  private writeAccountFile(name: string, content: Record<string, string>): void {
    const filePath = path.join(this.accountsDir(), name)
    fs.writeFileSync(filePath, stringify(content), 'utf8')
    fs.chmodSync(filePath, 0o600)
  }
}

// Default export for convenience
export default new AccountsWrapper()
