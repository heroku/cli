'use strict'

const nock = require('nock')

function appCollaboratorWithPermissions (args) {
  return nock('https://api.heroku.com:443')
  .patch(`/organizations/apps/myapp/collaborators/${args.email}`, {
    permissions: args.permissions
  }).reply(200)
}

function orgAppTransfer () {
  return nock('https://api.heroku.com:443')
    .patch('/organizations/apps/myapp', { owner: 'team' })
    .reply(200, { name: 'myapp', owner: { email: 'team@herokumanager.com' } })
}

function personalToPersonal () {
  return nock('https://api.heroku.com:443')
    .patch('/organizations/apps/myapp', {owner: 'raulb@heroku.com'})
    .reply(200, { name: 'myapp', owner: { email: 'raulb@heroku.com' } })
}

function updateMemberRole (email = 'raulb@heroku.com', role = 'admin') {
  return nock('https://api.heroku.com:443')
    .patch('/organizations/myorg/members', {email, role})
    .reply(200)
}

module.exports = {
  appCollaboratorWithPermissions,
  orgAppTransfer,
  personalToPersonal,
  updateMemberRole
}
