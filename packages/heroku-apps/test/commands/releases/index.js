'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/releases')
const expect = require('unexpected')

describe('releases', () => {
  beforeEach(() => cli.mockConsole())

  const releases = [
    {
      'created_at': '2015-11-18T01:37:41Z',
      'description': 'Set foo config vars',
      'status': 'succeeded',
      'id': '5efa3510-e8df-4db0-a176-83ff8ad91eb5',
      'slug': {
        'id': '37994c83-39a3-4cbf-b318-8f9dc648f701'
      },
      'updated_at': '2015-11-18T01:37:41Z',
      'user': {
        'email': 'jeff@heroku.com',
        'id': '5985f8c9-a63f-42a2-bec7-40b875bb986f'
      },
      'version': 40,
      'current': false
    },
    {
      'created_at': '2015-11-18T01:36:38Z',
      'description': 'Remove AWS_SECRET_ACCESS_KEY config vars',
      'status': 'failed',
      'id': '7be47426-2c1b-4e4d-b6e5-77c79169aa41',
      'slug': {
        'id': '37994c83-39a3-4cbf-b318-8f9dc648f701'
      },
      'updated_at': '2015-11-18T01:36:38Z',
      'user': {
        'email': 'jeff@heroku.com',
        'id': '5985f8c9-a63f-42a2-bec7-40b875bb986f'
      },
      'version': 39,
      'current': false
    },
    {
      'created_at': '2015-11-18T01:36:38Z',
      'description': 'second commit',
      'status': 'pending',
      'id': '7be47426-2c1b-4e4d-b6e5-77c79169aa41',
      'slug': {
        'id': '37994c83-39a3-4cbf-b318-8f9dc648f701'
      },
      'updated_at': '2015-11-18T01:36:38Z',
      'user': {
        'email': 'jeff@heroku.com',
        'id': '5985f8c9-a63f-42a2-bec7-40b875bb986f'
      },
      'version': 38,
      'current': false
    },
    {
      'created_at': '2015-11-18T01:36:38Z',
      'description': 'first commit',
      'status': null,
      'id': '7be47426-2c1b-4e4d-b6e5-77c79169aa41',
      'slug': {
        'id': '37994c83-39a3-4cbf-b318-8f9dc648f701'
      },
      'updated_at': '2015-11-18T01:36:38Z',
      'user': {
        'email': 'jeff@heroku.com',
        'id': '5985f8c9-a63f-42a2-bec7-40b875bb986f'
      },
      'version': 37,
      'current': true
    }
  ]

  const extended = [
    {
      'created_at': '2015-11-18T01:37:41Z',
      'description': 'Set foo config vars',
      'status': 'succeeded',
      'id': '5efa3510-e8df-4db0-a176-83ff8ad91eb5',
      'slug': {
        'id': '37994c83-39a3-4cbf-b318-8f9dc648f701'
      },
      'updated_at': '2015-11-18T01:37:41Z',
      'user': {
        'email': 'jeff@heroku.com',
        'id': '5985f8c9-a63f-42a2-bec7-40b875bb986f'
      },
      'version': 40,
      extended: {
        slug_id: 1,
        slug_uuid: 'uuid'
      }
    }
  ]

  it('shows releases', () => {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)
    return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(cli.stdout, 'to equal', `=== myapp Releases - Current: v37
v40  Set foo config vars          jeff@heroku.com  2015/11/18 01:37:41 +0000
v39  … release command failed     jeff@heroku.com  2015/11/18 01:36:38 +0000
v38  … release command executing  jeff@heroku.com  2015/11/18 01:36:38 +0000
v37  first commit                 jeff@heroku.com  2015/11/18 01:36:38 +0000
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows releases as json', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)
    return cmd.run({app: 'myapp', flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout)[0], 'to satisfy', {version: 40}))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows message if no releases', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [])
    return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(cli.stdout, 'to equal', 'myapp has no releases.\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows extended info', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases?extended=true')
      .reply(200, extended)
    return cmd.run({app: 'myapp', flags: {extended: true}})
      .then(() => expect(cli.stdout, 'to equal', `=== myapp Releases
v40      Set foo config vars   jeff@heroku.com  2015/11/18 01:37:41 +0000  1                 uuid
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows no current release', () => {
    process.stdout.columns = 80
    releases[releases.length - 1].current = false

    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)
    return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(cli.stdout, 'to equal', `=== myapp Releases
v40  Set foo config vars          jeff@heroku.com  2015/11/18 01:37:41 +0000
v39  … release command failed     jeff@heroku.com  2015/11/18 01:36:38 +0000
v38  … release command executing  jeff@heroku.com  2015/11/18 01:36:38 +0000
v37  first commit                 jeff@heroku.com  2015/11/18 01:36:38 +0000
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })
})
