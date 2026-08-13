import type {HerokuApiClientOptions} from '@heroku/sdk'

import {APIClient, vars} from '@heroku-cli/command'

/**
 * Build the `clientOptions` for a `HerokuSDK` from the CLI's own APIClient.
 *
 * Threads two CLI-resolved values into the SDK so its platform client matches
 * what the rest of the CLI already uses:
 *   - `token`   — the CLI-resolved auth token (keychain / netrc / HEROKU_API_KEY),
 *                 so keychain-authenticated users don't hit auth failures.
 *   - `baseUrl` — the CLI's resolved platform API URL (`vars.apiUrl`), which
 *                 honors HEROKU_HOST exactly as `this.heroku` does. When
 *                 HEROKU_HOST is unset this equals the SDK's own production
 *                 default, so it is a no-op for normal users.
 *
 * NOTE: `baseUrl` is the *platform* host. Do not use these options for a
 * HerokuSDK instance whose metrics/data services you intend to use — the
 * metrics service resolves its own host and a shared platform `baseUrl` would
 * clobber it. Multi-service commands (e.g. apps:errors) construct a separate
 * instance for metrics with `{token: heroku.auth}` only.
 *
 * TRANSITIONAL: what is temporary here is the *source* of these values — the
 * legacy `APIClient` / `@heroku-cli/command` `vars`, which the CLI intends to
 * retire. The threading itself is NOT temporary: once `APIClient` is gone this
 * should be re-sourced to the CLI's replacement auth/host resolution, not
 * deleted. The SDK must still receive the CLI-resolved token (keychain / netrc
 * / HEROKU_API_KEY) and the HEROKU_HOST-aware `baseUrl`, or keychain-
 * authenticated and staging (HEROKU_HOST) users break.
 */
export function sdkClientOptions(heroku: APIClient): HerokuApiClientOptions {
  return {baseUrl: vars.apiUrl, token: heroku.auth}
}
