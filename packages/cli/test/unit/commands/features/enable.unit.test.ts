import {expect, test} from '@oclif/test'

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
})
