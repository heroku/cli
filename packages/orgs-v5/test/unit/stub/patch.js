'use strict'

const nock = require('nock')

function teamAppTransfer() {
  return nock('https://api.heroku.com:443')
    .patch('/teams/apps/myapp', {owner: 'team'})
    .reply(200, {name: 'myapp', owner: {email: 'team@herokumanager.com'}})
}

function personalToPersonal() {
  return nock('https://api.heroku.com:443')
    .patch('/teams/apps/myapp', {owner: 'raulb@heroku.com'})
    .reply(200, {name: 'myapp', owner: {email: 'raulb@heroku.com'}})
}

module.exports = {
  teamAppTransfer,
  personalToPersonal,
}
