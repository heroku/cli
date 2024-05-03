'use strict'

const cli = require('@heroku/heroku-cli-util')

function display(auth) {
  const obj = {
    ID: auth.id,
    Description: auth.description,
    Scope: auth.scope.join(','),
  }
  if (auth.client) {
    obj.Client = auth.client.name
    obj['Redirect URI'] = auth.client.redirect_uri
  } else obj.Client = '<none>'
  if (auth.access_token) {
    obj.Token = auth.access_token.token
    const addSeconds = require('date-fns/add_seconds')
    const distanceInWordsToNow = require('date-fns/distance_in_words_to_now')
    obj['Updated at'] = `${addSeconds(auth.updated_at, 0)} (${distanceInWordsToNow(auth.updated_at)} ago)`
    if (auth.access_token.expires_in) {
      const date = addSeconds(new Date(), auth.access_token.expires_in)
      obj['Expires at'] = `${date} (in ${distanceInWordsToNow(date)})`
    }
  }

  cli.styledObject(obj, [
    'Client',
    'Redirect URI',
    'ID',
    'Description',
    'Scope',
    'Token',
    'Expires at',
    'Updated at',
  ])
}

module.exports = {
  display,
}
