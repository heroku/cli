import {CliUx} from '@oclif/core'

const cli = CliUx.ux

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

  settings.auto_deploy = await cli.confirm(`Automatically deploy the ${branch} branch to staging?`)

  if (settings.auto_deploy) {
    settings.wait_for_ci = await cli.confirm(`Wait for CI to pass before deploying the ${branch} branch to staging?`)
  }

  settings.pull_requests.enabled = await cli.confirm('Enable review apps?')

  if (settings.pull_requests.enabled) {
    settings.pull_requests.auto_deploy = await cli.confirm('Automatically create review apps for every PR?')
  }

  if (settings.pull_requests.enabled) {
    settings.pull_requests.auto_destroy = await cli.confirm('Automatically destroy idle review apps after 5 days?')
  }

  return settings
}
