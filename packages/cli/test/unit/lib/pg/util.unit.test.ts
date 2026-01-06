import * as Heroku from '@heroku-cli/schema'
import {expect} from 'chai'

import type {CredentialsInfo} from '../../../../src/lib/pg/types.js'
import {
  configVarNamesFromValue,
  databaseNameFromUrl,
  formatResponseWithCommands,
  presentCredentialAttachments,
} from '../../../../src/lib/pg/util.js'

describe('util', function () {
  describe('formatResponseWithCommands', function () {
    it('formats commands in backticks', function () {
      const input = 'Run `heroku pg:info` to see details'
      const result = formatResponseWithCommands(input)
      expect(result).to.include('heroku pg:info')
      expect(result).not.to.include('`')
    })
  })

  describe('presentCredentialAttachments', function () {
    it('returns credential name and attachments', function () {
      const app = 'myapp'
      const cred = 'default'
      const credAttachments: Required<Heroku.AddOnAttachment>[] = [
        {
          id: '1',
          name: 'DATABASE',
          app: {id: 'app-id', name: app},
          addon: {id: 'addon-id', name: 'postgres-1'} as Required<Heroku.AddOn>,
          namespace: null,
          config_vars: ['DATABASE_URL'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          web_url: 'https://example.com',
          log_input_url: 'https://example.com/logs',
        },
      ]
      const credentials: CredentialsInfo = []

      const result = presentCredentialAttachments(app, credAttachments, credentials, cred)

      expect(result).to.include(cred)
      expect(result).to.include('DATABASE')
    })

    it('includes rotation information when credential is rotating', function () {
      const app = 'myapp'
      const cred = 'default'
      const credAttachments: Required<Heroku.AddOnAttachment>[] = [
        {
          id: '1',
          name: 'DATABASE',
          app: {id: 'app-id', name: app},
          addon: {id: 'addon-id', name: 'postgres-1'} as Required<Heroku.AddOn>,
          namespace: null,
          config_vars: ['DATABASE_URL'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          web_url: 'https://example.com',
          log_input_url: 'https://example.com/logs',
        },
      ]
      const credentials: CredentialsInfo = [
        {
          uuid: 'uuid',
          name: cred,
          state: 'rotating',
          database: 'db',
          host: 'host',
          port: 5432,
          credentials: [
            {
              user: 'user1',
              password: 'pass',
              state: 'active',
              connections: 5,
            },
          ],
        },
      ]

      const result = presentCredentialAttachments(app, credAttachments, credentials, cred)

      expect(result).to.include('user1')
      expect(result).to.include('5 connections')
    })
  })

  describe('configVarNamesFromValue', function () {
    it('finds exact matches', function () {
      const config = {
        DATABASE_URL: 'postgres://user:pass@host:5432/db',
        OTHER_URL: 'postgres://user:pass@host:5432/db',
      }
      const value = 'postgres://user:pass@host:5432/db'

      const result = configVarNamesFromValue(config, value)

      expect(result).to.include('DATABASE_URL')
      expect(result).to.include('OTHER_URL')
    })

    it('does not match URLs with different hostname', function () {
      const config = {
        DATABASE_URL: 'postgres://user:pass@host:5432/db',
        OTHER_URL: 'postgres://user:pass@different-host:5432/db',
      }
      const value = 'postgres://user:pass@host:5432/db'

      const result = configVarNamesFromValue(config, value)

      expect(result).to.include('DATABASE_URL')
      expect(result).not.to.include('OTHER_URL')
    })

    it('sorts DATABASE_URL last', function () {
      const config = {
        DATABASE_URL: 'postgres://user:pass@host:5432/db',
        MY_DB_URL: 'postgres://user:pass@host:5432/db',
      }
      const value = 'postgres://user:pass@host:5432/db'

      const result = configVarNamesFromValue(config, value)

      expect(result.at(-1)).to.equal('DATABASE_URL')
    })
  })

  describe('databaseNameFromUrl', function () {
    it('returns config var name without _URL suffix', function () {
      const config = {
        MY_DATABASE_URL: 'postgres://user:pass@host:5432/db',
        DATABASE_URL: 'postgres://user:pass@host:5432/db',
      }
      const uri = 'postgres://user:pass@host:5432/db'

      const result = databaseNameFromUrl(uri, config)

      expect(result).to.include('MY_DATABASE')
    })

    it('returns host:port/pathname when no config var matches', function () {
      const config = {
        DATABASE_URL: 'postgres://user:pass@different-host:5432/db',
      }
      const uri = 'postgres://user:pass@host:5432/db'

      const result = databaseNameFromUrl(uri, config)

      expect(result).to.include('host:5432')
      expect(result).to.include('/db')
    })
  })
})
