import {hux} from '@heroku/heroku-cli-util'

const DEFAULT_SETTINGS = {
  auto_deploy: true,
  wait_for_ci: true,
  pull_requests: {
    enabled: true,
    auto_deploy: true,
    auto_destroy: true,
  },
}

export default async function getSettings(yes: any, branch: any) {
  if (yes) {
    return DEFAULT_SETTINGS
  }

  const settings = {
    auto_deploy: true,
    wait_for_ci: true,
    pull_requests: {
      enabled: true,
      auto_deploy: true,
      auto_destroy: true,
    },
  }

  settings.auto_deploy = await hux.confirm(`Automatically deploy the ${branch} branch to staging?`)

  if (settings.auto_deploy) {
    settings.wait_for_ci = await hux.confirm(`Wait for CI to pass before deploying the ${branch} branch to staging?`)
  }

  settings.pull_requests.enabled = await hux.confirm('Enable review apps?')

  if (settings.pull_requests.enabled) {
    settings.pull_requests.auto_deploy = await hux.confirm('Automatically create review apps for every PR?')
  }

  if (settings.pull_requests.enabled) {
    settings.pull_requests.auto_destroy = await hux.confirm('Automatically destroy idle review apps after 5 days?')
  }

  return settings
}
