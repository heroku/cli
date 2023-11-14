import {expect, test} from '@oclif/test'
import {ux} from '@oclif/core'

describe('labs:info', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      }),
    )
    .stderr()
    .command(['labs:info', 'feature-a'])
    .it('shows user labs feature info', ({stdout, stderr}) => {
      expect(stdout).to.equal('=== feature-a\n\nDescription: a user lab feature\nDocs:        https://devcenter.heroku.com\nEnabled:     true\n')
      expect(stderr).to.be.empty
    })
})
