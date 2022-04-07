import cli from 'cli-ux'

export default async function getSettings(yes: any, repo: any, branch: any) {
  const DEFAULT_SETTINGS = {
    auto_deploy: true,
    wait_for_ci: true,
    automatic_review_apps: true,
    destroy_stale_apps: true,
    pull_requests: {
      enabled: true,
    },
    repo: repo,
  }

  if (yes) {
    DEFAULT_SETTINGS.repo = repo
    return DEFAULT_SETTINGS
  }

  const settings = {
    auto_deploy: true,
    wait_for_ci: true,
    automatic_review_apps: true,
    destroy_stale_apps: true,
    pull_requests: {
      enabled: true,
    },
    repo: repo,
  }

  settings.pull_requests.enabled = await cli.confirm('Enable review apps?')

  if (settings.pull_requests.enabled) {
    settings.automatic_review_apps = await cli.confirm('Automatically create review apps for every PR?')
    settings.wait_for_ci = await cli.confirm('Wait for CI to pass before creating review app?')
  }

  if (settings.pull_requests.enabled) {
    settings.destroy_stale_apps = await cli.confirm('Automatically destroy idle review apps after 5 days?')
  }

  return settings
}
