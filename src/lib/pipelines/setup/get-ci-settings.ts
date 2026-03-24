import {HuxHelpers} from '../../hux-helpers.js'

export default async function getCISettings(yes: any, organization: any) {
  const settings = {
    ci: true,
    organization: undefined,
  }

  if (yes) {
    delete settings.organization
    return settings
  }

  settings.ci = await HuxHelpers.confirm('Enable automatic Heroku CI test runs?')

  if (settings.ci && organization) {
    settings.organization = organization
  }

  return settings
}
