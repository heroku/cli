import {HuxHelpers} from '../../hux-helpers.js'

const DEFAULT_SETTINGS = {
  auto_deploy: true,
  pull_requests: {
    auto_deploy: true,
    auto_destroy: true,
    enabled: true,
  },
  wait_for_ci: true,
}

export default async function getSettings(yes: any, branch: any) {
  if (yes) {
    return DEFAULT_SETTINGS
  }

  const settings = {
    auto_deploy: true,
    pull_requests: {
      auto_deploy: true,
      auto_destroy: true,
      enabled: true,
    },
    wait_for_ci: true,
  }

  settings.auto_deploy = await HuxHelpers.confirm(`Automatically deploy the ${branch} branch to staging?`)

  if (settings.auto_deploy) {
    settings.wait_for_ci = await HuxHelpers.confirm(`Wait for CI to pass before deploying the ${branch} branch to staging?`)
  }

  settings.pull_requests.enabled = await HuxHelpers.confirm('Enable review apps?')

  if (settings.pull_requests.enabled) {
    settings.pull_requests.auto_deploy = await HuxHelpers.confirm('Automatically create review apps for every PR?')
  }

  if (settings.pull_requests.enabled) {
    settings.pull_requests.auto_destroy = await HuxHelpers.confirm('Automatically destroy idle review apps after 5 days?')
  }

  return settings
}
