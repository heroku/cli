import {expect, test} from '@oclif/test'
import stripAnsi = require('strip-ansi')

describe('features:disable',  function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/features/feature-a')
        .reply(200, {enabled: true})
        .patch('/apps/myapp/features/feature-a', {enabled: false})
        .reply(200)
    })
    .command(['features:disable', '-a', 'myapp', 'feature-a'])
    .it('disables an app feature', ({stdout, stderr}) => {
      expect(stderr).to.include('Disabling feature-a for ⬢ myapp... done')
      expect(stdout).to.equal('')
    })

  test
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/features/feature-a')
        .reply(200, {enabled: false})
    })
    .command(['features:disable', '-a', 'myapp', 'feature-a'])
    .catch((error: any) => {
      expect(stripAnsi(error.message)).to.equal('feature-a is already disabled.')
    })
    .it('errors if feature is already disabled')
})
