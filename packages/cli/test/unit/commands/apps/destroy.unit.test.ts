import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

describe('apps:destroy', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('deletes the app', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, {name: 'myapp'})
      .delete('/apps/myapp').reply(200)

    const {stdout, stderr} = await runCommand(['apps:destroy', '--app', 'myapp', '--confirm', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.include('Destroying myapp (including all add-ons)... done')
  })

  it('deletes the app via arg', async function () {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, {name: 'myapp'})
      .delete('/apps/myapp').reply(200)

    const {stdout, stderr} = await runCommand(['apps:destroy', 'myapp', '--confirm', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.include('Destroying myapp (including all add-ons)... done')
  })

  it('errors without an app', async function () {
    const {error} = await runCommand(['apps:destroy'])

    expect(error?.message).to.include('No app specified.')
  })
})
