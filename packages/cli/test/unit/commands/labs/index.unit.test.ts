import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('labs', function () {
  afterEach(() => nock.cleanAll())

  it('shows labs features without flag', async () => {
    nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {enabled: true, name: 'lab feature a', description: 'a user lab feature'},
        {enabled: false, name: 'lab feature b', description: 'a user lab feature'},
      ])

    const {stdout, stderr} = await runCommand(['labs'])

    expect(stdout).to.contain('=== User Features jeff@heroku.com\n\n[+] lab feature a  a user lab feature\n[ ] lab feature b  a user lab feature\n')
    expect(stderr).to.be.empty
  })

  it('shows labs features with flag', async () => {
    nock('https://api.heroku.com:443')
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
      ])

    const {stdout, stderr} = await runCommand(['labs', '-a', 'myapp'])
    expect(stdout).to.equal(`=== User Features jeff@heroku.com

[+] lab feature a  a user lab feature
[ ] lab feature b  a user lab feature

=== App Features ⬢ myapp

[+] lab feature c  an app lab feature
`)
    // expect(stdout).to.contain('=== User Features jeff@heroku.com')
    // expect(stdout).to.contain('[+] lab feature a  a user lab feature')
    // expect(stdout).to.contain('[ ] lab feature b  a user lab feature')
    // expect(stdout).to.contain('=== App Features')
    // expect(stdout).to.contain('myapp')
    // expect(stdout).to.contain('[+] lab feature c  an app lab feature')
    expect(stderr).to.be.empty
  })

  it('shows labs features with json flag', async () => {
    nock('https://api.heroku.com:443')
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
      ])

    const {stdout, stderr} = await runCommand(['labs', '-a', 'myapp', '--json'])

    expect(stdout).to.equal(`{
  "app": [
    {
      "enabled": true,
      "name": "lab feature c",
      "description": "an app lab feature"
    }
  ],
  "user": [
    {
      "enabled": true,
      "name": "lab feature a",
      "description": "a user lab feature"
    },
    {
      "enabled": false,
      "name": "lab feature b",
      "description": "a user lab feature"
    }
  ]
}
`)
    expect(stderr).to.be.empty
  })
})
