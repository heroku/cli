'use strict'

import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {formatDistanceToNow, addSeconds} from 'date-fns'

export function display(auth: Heroku.OAuthAuthorization) {
  interface StyledObject {
    ID: string | undefined;
    Description: string | undefined;
    Scope: string | undefined;
    Client?: string;
    Token?: string;
    'Redirect URI'?: string;
    'Updated at'?: string;
    'Expires at'?: string;
  }

  const obj: StyledObject = {
    ID: auth.id,
    Description: auth.description,
    Scope: auth.scope ? auth.scope.join(',') : undefined,
    Client: '<none>',
  }

  if (auth.client) {
    obj.Client = auth.client.name
    obj['Redirect URI'] = auth.client.redirect_uri
  }

  if (auth.access_token) {
    obj.Token = auth.access_token.token
    if (auth.updated_at) {
      obj['Updated at'] = `${addSeconds(new Date(auth.updated_at), 0)} (${formatDistanceToNow(new Date(auth.updated_at))} ago)`
    }

    if (auth.access_token.expires_in) {
      const date = addSeconds(new Date(), auth.access_token.expires_in)
      obj['Expires at'] = `${date} (in ${formatDistanceToNow(date)})`
    }
  }

  ux.styledObject(obj, [
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
