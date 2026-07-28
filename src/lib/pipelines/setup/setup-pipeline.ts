import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'

export default async function setupPipeline(heroku: APIClient, settings: any, pipelineID: string, repoFullName: string) {
  if (!settings.pull_requests?.enabled) {
    return
  }

  try {
    await heroku.post(`/pipelines/${pipelineID}/review-app-config`, {
      body: {
        automatic_review_apps: settings.pull_requests.auto_deploy,
        destroy_stale_apps: settings.pull_requests.auto_destroy,
        pipeline: pipelineID,
        repo: repoFullName,
        wait_for_ci: settings.wait_for_ci,
      },
      headers: {Accept: 'application/vnd.heroku+json; version=3.review-apps'},
    })
  } catch (error: any) {
    ux.error(error.body?.message || error.message)
  }
}
