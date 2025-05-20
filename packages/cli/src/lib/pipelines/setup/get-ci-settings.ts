// import {hux} from '@heroku/heroku-cli-util'

export default async function getCISettings(yes: any, organization: any) {
  const settings = {
    ci: true,
    organization: undefined,
  }

  if (yes) {
    delete settings.organization
    return settings
  }

  // settings.ci = await hux.confirm('Enable automatic Heroku CI test runs?')

  if (settings.ci && organization) {
    settings.organization = organization
  }

  return settings
}
