import {
  getAuth as originalGetAuth,
  removeAuth as originalRemoveAuth,
  saveAuth as originalSaveAuth,
} from '@heroku-cli/command/lib/credential-manager-core/index.js'
import {setCredentialManagerProvider} from '@heroku-cli/command/lib/credential-manager.js'

interface Provider {
  getAuth: () => Promise<{account: string | undefined, token: string | undefined}>
  removeAuth: () => Promise<void>
  saveAuth: () => Promise<void>
}

export function stubCredentialManager(provider?: Partial<Provider>) {
  const originalProvider = {
    getAuth: originalGetAuth,
    removeAuth: originalRemoveAuth,
    saveAuth: originalSaveAuth,
  }

  const defaultProvider : Provider = {
    async getAuth() {
      return {account: undefined, token: undefined}
    },
    async removeAuth() {},
    async saveAuth() {},
  }

  setCredentialManagerProvider({...defaultProvider, ...provider})

  return {
    restore() {
      setCredentialManagerProvider(originalProvider)
    },
  }
}
