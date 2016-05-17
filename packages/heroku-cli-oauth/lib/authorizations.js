'use strict'

const cli = require('heroku-cli-util')

function display (auth) {
  cli.styledObject({
    Client: auth.client ? auth.client.name : '<none>',
    ID: auth.id,
    Description: auth.description,
    Scope: auth.scope.join(','),
    Token: auth.access_token.token
  }, [
    'Client',
    'ID',
    'Description',
    'Scope',
    'Token'
  ])
}

module.exports = {
  display
}
