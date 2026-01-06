import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('labs:enable', function () {
  afterEach(() => nock.cleanAll())

  it('enables a user lab feature', async () => {
    nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {email: 'gandalf@heroku.com'})
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: false,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/account/features/feature-a', {enabled: true})
      .reply(200)

    const {stdout, stderr} = await runCommand(['labs:enable', 'feature-a'])

    expect(stdout).to.be.empty
    expect(stderr).to.equal('Enabling feature-a for gandalf@heroku.com... done\n')
  })

  it('enables an app feature', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/features/feature-a')
      .reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        enabled: false,
        name: 'feature-a',
        description: 'an app labs feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/apps/myapp/features/feature-a', {enabled: true})
      .reply(200)

    const {stdout, stderr} = await runCommand(['labs:enable', 'feature-a', '-a', 'myapp'])

    expect(stdout).to.be.empty
    expect(stderr).to.contain('Enabling feature-a for myapp... done\n')
  })
})
