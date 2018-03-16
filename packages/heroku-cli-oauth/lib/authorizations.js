'use strict'

const cli = require('heroku-cli-util')

function display (auth) {
  const obj = {
    Client: auth.client ? auth.client.name : '<none>',
    ID: auth.id,
    Description: auth.description,
    Scope: auth.scope.join(',')
  }
  if (auth.access_token) {
    obj.Token = auth.access_token.token
    if (auth.access_token.expires_in) {
      const distanceInWordsToNow = require('date-fns/distance_in_words_to_now')
      const addSeconds = require('date-fns/add_seconds')
      console.dir(auth.access_token.expires_in)
      const date = addSeconds(new Date(), auth.access_token.expires_in)
      obj['Expires at'] = `${date} (${distanceInWordsToNow(date)})`
    }
  }

  cli.styledObject(obj, [
    'Client',
    'ID',
    'Description',
    'Scope',
    'Token',
    'Expires at'
  ])
}

module.exports = {
  display
}
