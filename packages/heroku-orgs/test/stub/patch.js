'use strict'

const nock = require('nock')

function orgAppTransfer () {
  return nock('https://api.heroku.com:443')
    .patch('/organizations/apps/myapp', { owner: 'team' })
    .reply(200, { name: 'myapp', owner: { email: 'team@herokumanager.com' } })
}

function personalAppTransfer () {
  return nock('https://api.heroku.com:443')
    .patch('/organizations/apps/myapp', {owner: 'raulb@heroku.com'})
    .reply(200, { name: 'myapp', owner: { email: 'raulb@heroku.com' } })
}

module.exports = {
  orgAppTransfer: orgAppTransfer,
  personalAppTransfer: personalAppTransfer
}
