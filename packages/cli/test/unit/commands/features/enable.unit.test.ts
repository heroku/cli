import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import stripAnsi from 'strip-ansi'

describe('features:enable', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('enables an app feature', async function () {
    api
      .get('/apps/myapp/features/feature-a')
      .reply(200, {enabled: false})
      .patch('/apps/myapp/features/feature-a', {enabled: true})
      .reply(200)

    const {stderr, stdout} = await runCommand(['features:enable', 'feature-a', '--app', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Enabling feature-a for')
    expect(stderr).to.contain('myapp')
    expect(stderr).to.contain('done')
  })

  it('errors if feature is already enabled', async function () {
    api
      .get('/apps/myapp/features/feature-a')
      .reply(200, {enabled: true})

    const {error} = await runCommand(['features:enable', '-a', 'myapp', 'feature-a'])

    expect(stripAnsi(error?.message || '')).to.equal('feature-a is already enabled.')
  })
})
