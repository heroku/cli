import {APIClient} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {App, ReviewApp} from '../types/fir.js'
import {REVIEW_APP_ACCEPT, waitForReviewApp} from './wait-review-app.js'

// eslint-disable-next-line max-params
export default async function createReviewApp(
  heroku: APIClient,
  pipelineId: string,
  branch: string,
  sourceUrl: string,
  wait: boolean,
  interval: number,
  options: {environment?: Record<string, unknown>; prNumber?: number} = {},
): Promise<ReviewApp> {
  const body: Record<string, unknown> = {
    branch,
    pipeline: pipelineId,
    source_blob: {url: sourceUrl, version: null},
  }
  if (options.prNumber !== undefined) body.pr_number = options.prNumber
  if (options.environment) body.environment = options.environment

  let reviewApp: ReviewApp
  try {
    ux.action.start(`Creating review app from ${color.cyan(branch)}`)
    const res = await heroku.post<ReviewApp>('/review-apps', {
      body,
      headers: {Accept: REVIEW_APP_ACCEPT},
    })
    reviewApp = res.body
    ux.action.stop()
  } catch (error) {
    ux.action.stop(color.red('!'))
    throw error
  }

  if (reviewApp.message) ux.stdout(reviewApp.message)

  if (reviewApp.status === 'errored') {
    throw new Error(reviewApp.error_status || reviewApp.message || 'The review app failed to be created.')
  }

  if (wait) {
    return waitForReviewApp(heroku, reviewApp, interval, undefined, 'Review app is building and will be ready when complete')
  }

  ux.action.start('Review app is building and will be ready when complete')
  const appName = await resolveAppName(heroku, reviewApp, interval)
  ux.action.stop('')

  if (appName) {
    ux.stdout(`Run ${color.code('heroku reviewapps:wait ' + appName)} to check progress.`)
  } else {
    ux.stdout(`Review app for ${color.cyan(branch)} is being created in the background.`)
  }

  return reviewApp
}

const APP_ID_STATUSES = new Set(['creating', 'pending'])

// The POST response often lands before an app has been provisioned, so poll the
// review app until an app id appears (or it stops being in progress), then look
// up the app's name.
async function resolveAppName(heroku: APIClient, reviewApp: ReviewApp, interval: number): Promise<string | undefined> {
  let current = reviewApp

  while (!current.app?.id && APP_ID_STATUSES.has(current.status)) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, interval * 1000))
    const {body} = await heroku.get<ReviewApp>(`/review-apps/${current.id}`, {
      headers: {Accept: REVIEW_APP_ACCEPT},
    })
    current = body
  }

  const appId = current.app?.id
  if (!appId) return undefined

  const {body: app} = await heroku.get<App>(`/apps/${appId}`)
  return app.name ?? undefined
}
