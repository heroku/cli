import {expect, test} from '@oclif/test'

describe('labs', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {enabled: true, name: 'lab feature a', description: 'a user lab feature'},
        {enabled: false, name: 'lab feature b', description: 'a user lab feature'},
      ]),
    )
    .command(['labs'])
    .it('shows labs features without flag', ({stdout, stderr}) => {
      expect(stdout).to.contain('=== User Features jeff@heroku.com\n\n[+] lab feature a  a user lab feature\n[ ] lab feature b  a user lab feature\n')
      expect(stderr).to.be.empty
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {enabled: true, name: 'lab feature a', description: 'a user lab feature'},
        {enabled: false, name: 'lab feature b', description: 'a user lab feature'},
      ])
      .get('/apps/myapp/features')
      .reply(200, [
        {enabled: true, name: 'lab feature c', description: 'an app lab feature'},
      ]),
    )
    .command(['labs', '-a', 'myapp'])
    .it('shows labs features with flag', ({stdout, stderr}) => {
      expect(stdout).to.equal('=== User Features jeff@heroku.com\n\n[+] lab feature a  a user lab feature\n[ ] lab feature b  a user lab feature\n\n=== App Features ⬢ myapp\n\n[+] lab feature c  an app lab feature\n')
      expect(stderr).to.be.empty
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {enabled: true, name: 'lab feature a', description: 'a user lab feature'},
        {enabled: false, name: 'lab feature b', description: 'a user lab feature'},
      ])
      .get('/apps/myapp/features')
      .reply(200, [
        {enabled: true, name: 'lab feature c', description: 'an app lab feature'},
      ]),
    )
    .command(['labs', '-a', 'myapp', '--json'])
    .it('shows labs features with json flag', ({stdout, stderr}) => {
      expect(stdout).to.equal('{\n  "user": [\n    {\n      "enabled": true,\n      "name": "lab feature a",\n      "description": "a user lab feature"\n    },\n    {\n      "enabled": false,\n      "name": "lab feature b",\n      "description": "a user lab feature"\n    }\n  ],\n  "app": [\n    {\n      "enabled": true,\n      "name": "lab feature c",\n      "description": "an app lab feature"\n    }\n  ]\n}\n')
      expect(stderr).to.be.empty
    })
})
