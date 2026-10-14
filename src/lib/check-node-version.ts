// Kept dependency-free and free of newer syntax/APIs (optional chaining,
// nullish coalescing, Array#at, regex v/d flags): bin/run.js uses it on Node
// versions this CLI no longer supports, so it must load and run there. Keep
// MIN_NODE_MAJOR in sync with package.json `engines.node` (a unit test
// enforces this).
export const MIN_NODE_MAJOR = 20

export const UNSUPPORTED_NODE_ERROR_CODE = 'HEROKU_UNSUPPORTED_NODE'

/**
 * Whether `error` is the load-time crash an unsupported Node version causes:
 * a dependency using newer regex syntax (e.g. the `v` flag) throws a
 * SyntaxError whose message mentions a "regular expression". Deliberately
 * narrow: other SyntaxErrors (e.g. JSON.parse) must not match. Fails open
 * (false) when the version can't be parsed.
 */
export function isUnsupportedNodeCrash(nodeVersion: string, error: unknown): boolean {
  const major = Number.parseInt(String(nodeVersion).replace(/^v/, ''), 10)
  if (Number.isNaN(major) || major >= MIN_NODE_MAJOR) {
    return false
  }

  // Match by name too: the telemetry worker reconstructs errors as plain
  // `Error`s (keeping `name`), so `instanceof SyntaxError` alone would miss it.
  const e = error as null | undefined | {message?: unknown; name?: unknown}
  const isSyntaxError = error instanceof SyntaxError || Boolean(e && e.name === 'SyntaxError')
  return isSyntaxError && typeof (e && e.message) === 'string' && /regular expression/i.test(String(e && e.message))
}

export function unsupportedNodeMessage(nodeVersion: string): string {
  const version = String(nodeVersion).replace(/^v/, '')
  return `Node.js v${version} is not supported. The Heroku CLI requires Node.js ${MIN_NODE_MAJOR} or later. `
    + 'Upgrade Node.js, or install the standalone Heroku CLI, which includes its own Node.js: '
    + 'https://devcenter.heroku.com/articles/heroku-cli'
}
