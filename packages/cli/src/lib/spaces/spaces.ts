import * as Heroku from '@heroku-cli/schema'

export function displayShieldState(space: Heroku.Space) {
  return space.shield ? 'on' : 'off'
}
