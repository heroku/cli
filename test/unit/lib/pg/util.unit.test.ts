import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {expect} from 'chai'
import sinon from 'sinon'

import type {NonAdvancedCredentialInfo} from '../../../../src/lib/data/types.js'

import {
  configVarNamesFromValue,
  databaseNameFromUrl,
  formatResponseWithCommands,
  getAllAdvancedDatabases,
  getAttachmentNamesByAddon,
  presentCredentialAttachments,
} from '../../../../src/lib/pg/util.js'
import {
  advancedAddonAttachment,
  nonAdvancedAddonAttachment,
  nonTargetAdvancedDbAttachment,
  targetAdvancedDbAttachment,
} from '../../../fixtures/data/pg/fixtures.js'

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
          addon: {id: 'addon-id', name: 'postgres-1'} as Required<Heroku.AddOn>,
          app: {id: 'app-id', name: app},
          config_vars: ['DATABASE_URL'],
          created_at: '2024-01-01T00:00:00Z',
          id: '1',
          log_input_url: 'https://example.com/logs',
          name: 'DATABASE',
          namespace: null,
          updated_at: '2024-01-01T00:00:00Z',
          web_url: 'https://example.com',
        },
      ]
      const credentials: NonAdvancedCredentialInfo[] = []

      const result = presentCredentialAttachments(app, credAttachments, credentials, cred)

      expect(result).to.include(cred)
      expect(result).to.include('DATABASE')
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

  describe('getAllAdvancedDatabases', function () {
    it('returns empty array when API returns no attachments', async function () {
      const getStub = sinon.stub().resolves({body: []})
      const heroku = {get: getStub} as unknown as APIClient

      const result = await getAllAdvancedDatabases(heroku, 'myapp')

      expect(result).to.deep.equal([])
      expect(getStub.calledOnce).to.be.true
      expect(getStub.calledWith(
        '/apps/myapp/addon-attachments',
        {
          headers: {
            Accept: 'application/vnd.heroku+json; version=3.sdk',
            'Accept-Inclusion': 'addon:plan,config_vars',
          },
        },
      )).to.be.true
    })

    it('returns only advanced databases and filters out non-advanced attachments', async function () {
      const heroku = {
        get: sinon.stub().resolves({
          body: [advancedAddonAttachment, nonAdvancedAddonAttachment],
        }),
      } as unknown as APIClient

      const result = await getAllAdvancedDatabases(heroku, 'myapp')

      expect(result).to.have.length(1)
      expect(result[0].id).to.equal(advancedAddonAttachment.addon.id)
      expect(result[0].name).to.equal(advancedAddonAttachment.addon.name)
      expect(result[0].attachment_names).to.deep.equal(['DATABASE'])
    })

    it('returns multiple advanced databases with attachment_names when API returns multiple advanced attachments', async function () {
      const heroku = {
        get: sinon.stub().resolves({
          body: [targetAdvancedDbAttachment, nonTargetAdvancedDbAttachment],
        }),
      } as unknown as APIClient

      const result = await getAllAdvancedDatabases(heroku, 'myapp')

      expect(result).to.have.length(2)
      const byId = Object.fromEntries(result.map(a => [a.id, a]))
      expect(byId[targetAdvancedDbAttachment.addon.id].attachment_names).to.deep.equal(['ADVANCED_DB'])
      expect(byId[nonTargetAdvancedDbAttachment.addon.id].attachment_names).to.deep.equal(['OTHER_ADVANCED_DB'])
    })
  })

  describe('getAttachmentNamesByAddon', function () {
    it('returns empty object for empty attachments array', function () {
      const result = getAttachmentNamesByAddon([])
      expect(result).to.deep.equal({})
    })

    it('returns one addon id with one attachment name for single attachment', function () {
      const result = getAttachmentNamesByAddon([advancedAddonAttachment])
      expect(result).to.deep.equal({
        [advancedAddonAttachment.addon.id]: ['DATABASE'],
      })
    })

    it('groups multiple attachments by addon id when addons differ', function () {
      const result = getAttachmentNamesByAddon([
        targetAdvancedDbAttachment,
        nonTargetAdvancedDbAttachment,
        nonAdvancedAddonAttachment,
      ])
      expect(result).to.deep.equal({
        [nonAdvancedAddonAttachment.addon.id]: ['STANDARD_DATABASE'],
        [nonTargetAdvancedDbAttachment.addon.id]: ['OTHER_ADVANCED_DB'],
        [targetAdvancedDbAttachment.addon.id]: ['ADVANCED_DB'],
      })
    })

    it('groups multiple attachment names for the same addon into one array', function () {
      const sameAddonOtherAttachment = {
        ...targetAdvancedDbAttachment,
        id: 'another-attachment-id',
        name: 'ADVANCED_DB_REPLICA',
      }
      const result = getAttachmentNamesByAddon([
        targetAdvancedDbAttachment,
        sameAddonOtherAttachment,
      ])
      expect(result).to.deep.equal({
        [targetAdvancedDbAttachment.addon.id]: ['ADVANCED_DB', 'ADVANCED_DB_REPLICA'],
      })
    })
  })

  describe('databaseNameFromUrl', function () {
    it('returns config var name without _URL suffix', function () {
      const config = {
        DATABASE_URL: 'postgres://user:pass@host:5432/db',
        MY_DATABASE_URL: 'postgres://user:pass@host:5432/db',
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
