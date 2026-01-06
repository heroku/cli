import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('config', function () {
  afterEach(() => nock.cleanAll())

  it('shows config vars', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config', '--app=myapp'])

    expect(stdout).to.equal('=== myapp Config Vars\n\nLANG:     en_US.UTF-8\nRACK_ENV: production\n')
  })

  it('--json', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config', '--app=myapp', '-j'])

    expect(JSON.parse(stdout)).to.deep.equal({LANG: 'en_US.UTF-8', RACK_ENV: 'production'})
  })

  it('--shell', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {LANG: 'en_US.UTF-8', RACK_ENV: 'production'})

    const {stdout} = await runCommand(['config', '--app=myapp', '-s'])

    expect(stdout).to.equal(`LANG=en_US.UTF-8
RACK_ENV=production
`)
  })
})
