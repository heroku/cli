import {APIClient} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {ReviewApp} from '../types/fir.js'

export const REVIEW_APP_ACCEPT = 'application/vnd.heroku+json; version=3.review-apps'
const IN_PROGRESS_STATUSES = new Set(['creating', 'deleting', 'pending'])
const DEFAULT_WAIT_INTERVAL = 5

// Parse a --wait-interval flag (seconds), falling back to the default for
// missing, non-numeric, or negative values.
export function parseWaitInterval(value?: string): number {
  const interval = Number.parseInt(value || '', 10)
  return !interval || interval < 0 ? DEFAULT_WAIT_INTERVAL : interval
}

// eslint-disable-next-line max-params
export const waitForReviewApp = async function (
  api: APIClient,
  reviewApp: ReviewApp,
  interval: number,
  appIdentifier?: string,
  actionMessage?: string,
): Promise<ReviewApp> {
  let body = {...reviewApp}
  const inProgress = IN_PROGRESS_STATUSES.has(body.status)

  // Only pending/creating/deleting are in progress. Any other status is
  // terminal, so skip polling and return immediately (surfacing an error below
  // if it failed).
  if (inProgress) {
    ux.action.start(actionMessage || `Creating review app for ${color.app(body.branch)}`)

    // Poll the app-scoped endpoint when we have an app identifier, otherwise
    // fall back to looking the review app up by its own id.
    const statusPath = appIdentifier
      ? `/apps/${appIdentifier}/review-app`
      : `/review-apps/${body.id}`

    while (IN_PROGRESS_STATUSES.has(body.status)) {
      const {body: refreshed} = await api.get<ReviewApp>(statusPath, {
        headers: {Accept: REVIEW_APP_ACCEPT},
      })
      body = refreshed

      // Exit as soon as it's no longer in progress so we don't sleep an extra
      // interval after the app is already done.
      if (!IN_PROGRESS_STATUSES.has(body.status)) break

      // eslint-disable-next-line no-promise-executor-return
      await new Promise(resolve => setTimeout(resolve, interval * 1000))
    }
  }

  if (body.status === 'errored') {
    if (inProgress) ux.action.stop(color.red('!'))
    throw new Error(body.message || body.error_status || `The review app failed to be created (status: ${body.status}).`)
  }

  if (inProgress) ux.action.stop()
  return body
}
