'use strict'

const nock = require('nock')

function collaboratorsOrgApp (app, email) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'}
  })
    .delete(`/organizations/apps/${app}/collaborators/${email}`).reply(200, {})
}

function collaboratorsPersonalApp (app, email) {
  return nock('https://api.heroku.com:443', {})
    .delete(`/apps/${app}/collaborators/${email}`).reply(200, {})
}

function memberFromOrg () {
  return nock('https://api.heroku.com:443', {})
    .delete('/organizations/myorg/members/foo%40foo.com').reply(200)
}

module.exports = {
  collaboratorsOrgApp,
  collaboratorsPersonalApp,
  memberFromOrg
}
