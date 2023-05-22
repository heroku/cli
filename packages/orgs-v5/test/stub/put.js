'use strict'

const nock = require('nock')

function sendInvite(email = 'raulb@heroku.com', role = 'admin') {
  return nock('https://api.heroku.com:443')
    .put('/teams/myteam/invitations', {email, role})
    .reply(200)
}

function updateMemberRole(email = 'raulb@heroku.com', role = 'admin') {
  return nock('https://api.heroku.com:443')
    .put('/teams/myteam/members', {email, role})
    .reply(200)
}

module.exports = {
  sendInvite,
  updateMemberRole,
}
