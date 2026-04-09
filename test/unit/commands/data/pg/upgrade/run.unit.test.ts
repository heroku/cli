import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgUpgradeRun from '../../../../../../src/commands/data/pg/upgrade/run.js'
import {
  advancedAddonAttachment,
  nonAdvancedAddonAttachment,
  pgInfo,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:upgrade:run', function () {
  it('upgrades an advanced database to the latest version', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [advancedAddonAttachment])
    const {addon, name: attachmentName} = advancedAddonAttachment
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/info`)
      .reply(200, {...pgInfo, version: '16.10'})
      .post(`/data/postgres/v1/${addon.id}/upgrade/run`, {})
      .reply(200, {message: 'Upgrade started. Monitor progress with heroku data:pg:info.'})

    await runCommand(DataPgUpgradeRun, [
      attachmentName,
      '--app=myapp',
      '--confirm=myapp',
    ])

    resolveApi.done()
    dataApi.done()

    expect(ansis.strip(stderr.output)).to.equal(
      heredoc(`
        Upgrading your ⛁ ${addon.name} database from 16.10 to the latest supported Postgres version... done
        Upgrade started. Use heroku data:pg:upgrade:wait advanced-horizontal-01234 -a myapp to monitor progress.
      `),
    )
    expect(stdout.output).to.equal('')
  })

  it('upgrades an advanced database to a specific version with --version', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [advancedAddonAttachment])
    const {addon, name: attachmentName} = advancedAddonAttachment
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/info`)
      .reply(200, {...pgInfo, version: '16.10'})
      .post(`/data/postgres/v1/${addon.id}/upgrade/run`, {version: '17.5'})
      .reply(200, {message: 'Backend returned message should be ignored.'})

    await runCommand(DataPgUpgradeRun, [
      attachmentName,
      '--app=myapp',
      '--confirm=myapp',
      '--version=17.5',
    ])

    resolveApi.done()
    dataApi.done()

    expect(ansis.strip(stderr.output)).to.include('from 16.10 to 17.5')
    expect(ansis.strip(stderr.output)).to.include('Upgrade started.')
    expect(ansis.strip(stderr.output)).not.to.include('Backend returned message should be ignored.')
  })

  it('errors if database is not Advanced-tier', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [nonAdvancedAddonAttachment])
    const {addon, name: attachmentName} = nonAdvancedAddonAttachment

    try {
      await runCommand(DataPgUpgradeRun, [
        attachmentName,
        '--app=myapp',
        '--confirm=myapp',
      ])
    } catch (error: unknown) {
      resolveApi.done()
      expect(ansis.strip((error as Error).message)).to.equal(
        'You can only use this command on Advanced-tier databases.\n'
          + `Use heroku pg:upgrade:run ${addon.name} --app myapp instead.`,
      )
    }
  })

  it('displays the correct error when the upgrade API fails', async function () {
    const resolveApi = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [advancedAddonAttachment])
    const {addon, name: attachmentName} = advancedAddonAttachment
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/info`)
      .reply(200, {...pgInfo, version: '16.10'})
      .post(`/data/postgres/v1/${addon.id}/upgrade/run`)
      .reply(422, {message: 'Database is not ready for upgrade.'})

    try {
      await runCommand(DataPgUpgradeRun, [
        attachmentName,
        '--app=myapp',
        '--confirm=myapp',
      ])
    } catch (error: unknown) {
      resolveApi.done()
      dataApi.done()
      expect(ansis.strip((error as Error).message)).to.include('Database is not ready for upgrade.')
    }
  })
})
