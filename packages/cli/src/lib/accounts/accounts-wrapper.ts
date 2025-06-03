import * as accounts from './accounts.js'
import * as Heroku from '@heroku-cli/schema'

export interface IAccountsWrapper {
  list(): Heroku.Account[] | []
  current(): Promise<string | null>
  add(name: string, username: string, password: string): void
  remove(name: string): void
  set(name: string): Promise<void>
}

export class AccountsWrapper implements IAccountsWrapper {
  list(): Heroku.Account[] | [] {
    return accounts.list()
  }

  async current(): Promise<string | null> {
    return accounts.current()
  }

  add(name: string, username: string, password: string): void {
    accounts.add(name, username, password)
  }

  remove(name: string): void {
    accounts.remove(name)
  }

  async set(name: string): Promise<void> {
    return accounts.set(name)
  }
}

// Default export for convenience
export default new AccountsWrapper()
