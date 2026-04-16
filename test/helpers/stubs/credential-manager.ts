import {
  getAuth as originalGetAuth,
  removeAuth as originalRemoveAuth,
  saveAuth as originalSaveAuth,
} from '@heroku-cli/command'
import {setCredentialManagerProvider} from '@heroku-cli/command/lib/credential-manager.js'
import sinon from 'sinon'

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

/**
 * Stubs `process.env.HEROKU_NETRC_WRITE` to `true` so `getStorageConfig()` takes the netrc-only path
 * (`credentialStore: null`, `useNetrc: true`).
 */
export function stubWithoutKeychain() {
  const env = {...process.env}
  const envStub = sinon.stub(process, 'env').value(env)
  process.env.HEROKU_NETRC_WRITE = 'true'

  return {
    restore() {
      envStub.restore()
    },
  }
}

/**
 * Stubs `process.platform` to `darwin` and `process.env.HEROKU_NETRC_WRITE`, so
 * `getStorageConfig()` resolves a native store with netrc
 * (`credentialStore: 'macos-keychain'`, `useNetrc: true`).
 */
export function stubWithKeychain() {
  const platformStub = sinon.stub(process, 'platform').value('darwin')

  const env = {...process.env}
  delete env.HEROKU_NETRC_WRITE
  const envStub = sinon.stub(process, 'env').value(env)

  return {
    restore() {
      platformStub.restore()
      envStub.restore()
    },
  }
}
