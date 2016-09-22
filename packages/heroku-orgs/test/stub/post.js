'use strict'

const nock = require('nock')

function collaborators () {
  return nock('https://api.heroku.com:443')
    .post('/apps/myapp/collaborators', {
      user: 'raulb@heroku.com'
    }).reply(200)
}

function orgAppcollaborators (email = 'raulb@heroku.com', permissions = [], response = {}) {
  let body = { user: email }
  if (permissions.length) {
    body.permissions = permissions
  }

  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'}
  })
    .post('/organizations/apps/myapp/collaborators', body).reply(response.code || 200, response.description)
}

function personalToPersonal () {
  return nock('https://api.heroku.com:443')
    .post('/account/app-transfers', {app: 'myapp', recipient: 'raulb@heroku.com'})
    .reply(200, {state: 'pending'})
}

module.exports = {
  collaborators,
  personalToPersonal,
  orgAppcollaborators
}
