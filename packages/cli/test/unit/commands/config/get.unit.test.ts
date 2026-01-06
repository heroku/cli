import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('config', function () {
  afterEach(() => nock.cleanAll())

  it('shows config vars', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', 'RACK_ENV'])

    expect(stdout).to.equal('production\n')
  })

  it('--shell', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', '-s', 'RACK_ENV'])

    expect(stdout).to.equal('RACK_ENV=production\n')
  })

  it('missing', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config:get', '--app=myapp', 'MISSING'])

    expect(stdout).to.equal('\n')
  })
})
