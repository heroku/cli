import * as nock from 'nock'

export function collaborators() {
  return nock('https://api.heroku.com:443')
    .post('/apps/myapp/collaborators', {
      user: 'raulb@heroku.com',
    }).reply(200)
}

export function teamAppCollaborators(email = 'raulb@heroku.com', permissions: string[] = []) {
  const body: {user: string, permissions?: string[]} = {user: email}
  if (permissions.length > 0) {
    body.permissions = permissions
  }

  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .post('/teams/apps/myapp/collaborators', body).reply(200)
}

export function personalToPersonal() {
  return nock('https://api.heroku.com:443')
    .post('/account/app-transfers', {app: 'myapp', recipient: 'raulb@heroku.com'})
    .reply(200, {state: 'pending'})
}
