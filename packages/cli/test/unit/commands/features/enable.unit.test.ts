import {expect, test} from '@oclif/test'
import stripAnsi = require('strip-ansi')

describe('features:enable', function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/features/feature-a')
        .reply(200, {enabled: false})
        .patch('/apps/myapp/features/feature-a', {enabled: true})
        .reply(200)
    })
    .command(['features:enable', 'feature-a', '--app', 'myapp'])
    .it('enables an app feature', ({stdout, stderr}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.contain('Enabling feature-a for ⬢ myapp... done\n')
    })

  test
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/features/feature-a')
        .reply(200, {enabled: true})
    })
    .command(['features:enable', '-a', 'myapp', 'feature-a'])
    .catch((error: any) => {
      expect(stripAnsi(error.message)).to.equal('feature-a is already enabled.')
    })
    .it('errors if feature is already enabled')
})
