import * as Heroku from '@heroku-cli/schema'

export function displayNat(nat?: Required<Heroku.SpaceNetworkAddressTranslation>) {
  if (!nat) return
  if (nat.state !== 'enabled') return nat.state
  return nat.sources.join(', ')
}
