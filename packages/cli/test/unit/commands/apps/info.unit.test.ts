import {expect, test} from '@oclif/test'
import {unwrap} from '../../../helpers/utils/unwrap'

const app = {
  name: 'myapp',
  database_size: 1000,
  create_status: 'complete',
  repo_size: 1000,
  slug_size: 1000,
  git_url: 'https://git.heroku.com/myapp',
  web_url: 'https://myapp.herokuapp.com',
  region: {name: 'eu'},
  build_stack: {name: 'cedar-14'},
  stack: {name: 'cedar-14'},
  owner: {email: 'foo@foo.com'},
  space: {name: 'myspace'},
  internal_routing: true,
}

const appStackChange = Object.assign({}, app, {
  build_stack: {name: 'heroku-22'},
})

const appExtended = Object.assign({}, app, {
  extended: {
    foo: 'bar',
    id: 12345,
  },
})

const appAcm = Object.assign({}, app, {
  acm: true,
})

const addons = [
  {plan: {name: 'papertrail'}},
  {plan: {name: 'heroku-redis'}},
]

const collaborators = [
  {user: {email: 'foo@foo.com'}},
  {user: {email: 'foo2@foo.com'}},
]

describe('apps:info', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }, api =>
      api
        .get('/apps/myapp')
        .reply(200, appAcm),
    )
    .nock('https://api.heroku.com:443', api =>
      api
        .get('/apps/myapp/addons')
        .reply(200, addons)
        .get('/apps/myapp/collaborators')
        .reply(200, collaborators)
        .get('/apps/myapp/dynos')
        .reply(200, [{type: 'web', size: 'Standard-1X', quantity: 2}]),
    )
    .command(['apps:info', '-a', 'myapp'])
    .it('shows app info', ({stdout, stderr}) => {
      expect(stdout).to.equal(`=== myapp
Addons:           heroku-redis
                  papertrail
Auto Cert Mgmt:   true
Collaborators:    foo2@foo.com
Database Size:    1000 B
Dynos:            web: 1
Git URL:          https://git.heroku.com/myapp
Internal Routing: true
Owner:            foo@foo.com
Region:           eu
Repo Size:        1000 B
Slug Size:        1000 B
Space:            myspace
Stack:            cedar-14
Web URL:          https://myapp.herokuapp.com
`)
      expect(unwrap(stderr)).to.contains('')
    })
})
