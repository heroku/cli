import {expect, test} from '@oclif/test'

describe('labs:info', function () {
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
    .command(['labs:info', 'feature-a'])
    .it('shows user labs feature info', ({stdout, stderr}) => {
      expect(stdout).to.equal('=== feature-a\n\nDescription: a user lab feature\nDocs:        https://devcenter.heroku.com\nEnabled:     true\n')
      expect(stderr).to.be.empty
    })

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
    .command(['labs:info', 'feature-a', '--json'])
    .it('shows user labs feature info as json', ({stdout, stderr}) => {
      expect(stdout).to.equal('{\n  "enabled": true,\n  "name": "feature-a",\n  "description": "a user lab feature",\n  "doc_url": "https://devcenter.heroku.com"\n}\n')
      expect(stderr).to.be.empty
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/account/features/feature-a').reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'an app labs feature',
        doc_url: 'https://devcenter.heroku.com',
      }),
    )
    .command(['labs:info', 'feature-a', '-a', 'myapp'])
    .it('shows app labs feature info', ({stdout, stderr}) => {
      expect(stdout).to.equal('=== feature-a\n\nDescription: an app labs feature\nDocs:        https://devcenter.heroku.com\nEnabled:     true\n')
      expect(stderr).to.be.empty
    })
})
