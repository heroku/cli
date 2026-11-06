import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {EssentialDatabaseNotSupportedError} from '@heroku/sdk/extensions/data'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/destroy.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import {MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:links:destroy', function () {
  const addon = fixtures.addons['dwh-db']
  let deleteFromDatabase: sinon.SinonStub
  let linkDelete: sinon.SinonStub
  let sdkMock: MockSDK

  beforeEach(function () {
    linkDelete = sinon.stub().resolves({name: 'postgres-link'})
    // Mirrors the SDK: resolve, run beforeDelete (the confirm gate), then delete.
    deleteFromDatabase = sinon.stub().callsFake(async (_app: string, _db: string, link: string, opts) => {
      await opts?.beforeDelete?.({addon, link})
      return {addon, link: await linkDelete(addon.id, link)}
    })
    sdkMock = mockSDKData({link: {deleteFromDatabase}})
  })

  afterEach(function () {
    sdkMock.restore()
    sinon.restore()
  })

  describe('on an essential database', function () {
    const essential = fixtures.addons['www-db']

    it('errors when attempting to destroy a link', async function () {
      deleteFromDatabase.rejects(new EssentialDatabaseNotSupportedError(essential as never, 'essential'))

      const {error} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        essential.name || '',
        'postgres-link',
      ])
      expect(error?.message).to.equal('pg:links isn\'t available for Essential-tier databases.')
    })
  })

  describe('on a production database', function () {
    it('destroys a link', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        addon.name || '',
        'postgres-link',
      ])

      expectOutput(stdout, '')
      expectOutput(stderr, heredoc(`
        Destroying link postgres-link from ${addon.name}... done
      `))
      expect(deleteFromDatabase.calledOnce).to.equal(true)
      expect(deleteFromDatabase.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', 'dwh-db', 'postgres-link'])
    })
  })

  describe('confirmation', function () {
    it('does not destroy the link when --confirm does not match the app', async function () {
      const {error} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'not-myapp', 'dwh-db', 'postgres-link'])

      expect(ansis.strip(error?.message ?? '')).to.equal('Confirmation not-myapp did not match myapp. Aborted.')
      expect(linkDelete.called).to.equal(false)
    })

    it('prompts for confirmation without --confirm, then destroys the link', async function () {
      const prompt = sinon.stub(hux, 'prompt').resolves('myapp')

      const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'dwh-db', 'postgres-link'])

      expect(prompt.calledOnce).to.equal(true)
      expect(stderr).to.contain('This command will affect the database dwh-db')
      expect(stderr).to.contain('This will delete postgres-link along with the tables and views created')
      expect(stderr).to.contain('Destroying link postgres-link from dwh-db... done')
    })

    it('passes the raw link name to the SDK', async function () {
      await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'myapp', 'dwh-db', 'my link'])

      expect(linkDelete.calledOnceWithExactly(addon.id, 'my link')).to.equal(true)
    })

    it('stops the spinner with a failure marker and rethrows when the delete fails', async function () {
      linkDelete.rejects(new Error('link delete failed'))

      const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'myapp', 'dwh-db', 'postgres-link'])

      expect(error?.message).to.equal('link delete failed')
      expect(stderr).to.contain('Destroying link postgres-link from dwh-db... !')
    })
  })
})
