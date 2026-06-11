import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {addSeconds, formatDistanceToNow} from 'date-fns'

function formatScope(scope: string[] | undefined): string | undefined {
  if (!scope || scope.length === 0) return undefined
  const isGranular = (s: string) => s.includes(':') || s.includes('.')
  const legacy = scope.filter(s => !isGranular(s))
  const granular = scope.filter(isGranular)
  const lines = [legacy.join(',')].filter(Boolean)
  for (const g of granular) lines.push(`        ${g}`)
  return lines.join('\n')
}

export function display(auth: Heroku.OAuthAuthorization) {
  interface StyledObject {
    Client?: string;
    Description: string | undefined;
    'Expires at'?: string;
    ID: string | undefined;
    'Redirect URI'?: string;
    Scope: string | undefined;
    Token?: string;
    'Updated at'?: string;
  }
  /* eslint-disable perfectionist/sort-objects */
  const obj: StyledObject = {
    Client: '<none>',
    ID: auth.id,
    Description: auth.description,
    Scope: formatScope(auth.scope),
  }
  /* eslint-enable perfectionist/sort-objects */
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

  hux.styledObject(obj, [
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
