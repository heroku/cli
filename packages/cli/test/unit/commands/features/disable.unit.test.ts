import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import stripAnsi from 'strip-ansi'

describe('features:disable',  function () {
  afterEach(() => nock.cleanAll())

  it('disables an app feature', async () => {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp/features/feature-a')
      .reply(200, {enabled: true})
      .patch('/apps/myapp/features/feature-a', {enabled: false})
      .reply(200)

    const {stdout, stderr} = await runCommand(['features:disable', '-a', 'myapp', 'feature-a'])

    expect(stderr).to.include('Disabling feature-a for')
    expect(stderr).to.include('myapp')
    expect(stderr).to.include('done')
    expect(stdout).to.equal('')
  })

  it('errors if feature is already disabled', async () => {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp/features/feature-a')
      .reply(200, {enabled: false})

    const {error} = await runCommand(['features:disable', '-a', 'myapp', 'feature-a'])

    expect(stripAnsi(error?.message || '')).to.equal('feature-a is already disabled.')
  })
})
