import {
  getAuth as originalGetAuth,
  removeAuth as originalRemoveAuth,
  saveAuth as originalSaveAuth,
} from '@heroku-cli/command/lib/credential-manager-core/index.js'
import {setCredentialManagerProvider} from '@heroku-cli/command/lib/credential-manager.js'

export function stubCredentialManager() {
  const originalProvider = {
    getAuth: originalGetAuth,
    removeAuth: originalRemoveAuth,
    saveAuth: originalSaveAuth,
  }

  setCredentialManagerProvider({
    async getAuth() {
      return {account: undefined, token: undefined}
    },
    async removeAuth() {},
    async saveAuth() {},
  })

  return {
    restore() {
      setCredentialManagerProvider(originalProvider)
    },
  }
}
