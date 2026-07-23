import {hux} from '@heroku/heroku-cli-util'

const DEFAULT_SETTINGS = {
  pull_requests: {
    auto_deploy: true,
    auto_destroy: true,
    enabled: true,
  },
  wait_for_ci: true,
}

export default async function getSettings(yes: any) {
  if (yes) {
    return DEFAULT_SETTINGS
  }

  const settings = {
    pull_requests: {
      auto_deploy: true,
      auto_destroy: true,
      enabled: true,
    },
    wait_for_ci: true,
  }

  settings.pull_requests.enabled = await hux.confirm('Enable review apps?')

  if (settings.pull_requests.enabled) {
    settings.pull_requests.auto_deploy = await hux.confirm('Automatically create review apps for every PR?')
    settings.pull_requests.auto_destroy = await hux.confirm('Automatically destroy idle review apps after 5 days?')
    settings.wait_for_ci = await hux.confirm('Wait for CI to pass before deploying review apps?')
  }

  return settings
}
