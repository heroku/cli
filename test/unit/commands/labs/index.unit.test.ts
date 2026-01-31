import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('labs', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows labs features without flag', async function () {
    api
      .get('/account')
      .reply(200, {email: 'gandalf@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {description: 'a user lab feature', enabled: true, name: 'lab feature a'},
        {description: 'a user lab feature', enabled: false, name: 'lab feature b'},
      ])

    const {stderr, stdout} = await runCommand(['labs'])

    expect(stdout).to.contain('=== User Features gandalf@heroku.com\n\n[+] lab feature a  a user lab feature\n[ ] lab feature b  a user lab feature\n')
    expect(stderr).to.be.empty
  })

  it('shows labs features with flag', async function () {
    api
      .get('/account')
      .reply(200, {email: 'gandalf@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {description: 'a user lab feature', enabled: true, name: 'lab feature a'},
        {description: 'a user lab feature', enabled: false, name: 'lab feature b'},
      ])
      .get('/apps/myapp/features')
      .reply(200, [
        {description: 'an app lab feature', enabled: true, name: 'lab feature c'},
      ])

    const {stderr, stdout} = await runCommand(['labs', '-a', 'myapp'])
    expect(stdout).to.equal(`=== User Features gandalf@heroku.com

[+] lab feature a  a user lab feature
[ ] lab feature b  a user lab feature

=== App Features ⬢ myapp

[+] lab feature c  an app lab feature
`)
    expect(stdout).to.contain('=== User Features gandalf@heroku.com')
    expect(stdout).to.contain('[+] lab feature a  a user lab feature')
    expect(stdout).to.contain('[ ] lab feature b  a user lab feature')
    expect(stdout).to.contain('=== App Features')
    expect(stdout).to.contain('myapp')
    expect(stdout).to.contain('[+] lab feature c  an app lab feature')
    expect(stderr).to.be.empty
  })

  it('shows labs features with json flag', async function () {
    api
      .get('/account')
      .reply(200, {email: 'gandalf@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {description: 'a user lab feature', enabled: true, name: 'lab feature a'},
        {description: 'a user lab feature', enabled: false, name: 'lab feature b'},
      ])
      .get('/apps/myapp/features')
      .reply(200, [
        {description: 'an app lab feature', enabled: true, name: 'lab feature c'},
      ])

    const {stderr, stdout} = await runCommand(['labs', '-a', 'myapp', '--json'])

    expect(stdout).to.equal(`{
  "app": [
    {
      "description": "an app lab feature",
      "enabled": true,
      "name": "lab feature c"
    }
  ],
  "user": [
    {
      "description": "a user lab feature",
      "enabled": true,
      "name": "lab feature a"
    },
    {
      "description": "a user lab feature",
      "enabled": false,
      "name": "lab feature b"
    }
  ]
}
`)
    expect(stderr).to.be.empty
  })
})
