'use strict'

const nock = require('nock')

function updateMemberRole (email = 'raulb@heroku.com', role = 'admin') {
  return nock('https://api.heroku.com:443')
    .put('/organizations/myorg/members', {email, role})
    .reply(200)
}

module.exports = {
  updateMemberRole
}
