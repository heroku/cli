// Kept dependency-free and free of newer syntax/APIs (optional chaining,
// nullish coalescing, Array#at, regex v/d flags): bin/run.js uses it on Node
// versions this CLI no longer supports, so it must load and run there.

// First Node major whose V8 parses the regex `v` flag; older versions crash on it.
export const FIRST_NODE_MAJOR_WITH_V_FLAG = 20

export const UNSUPPORTED_NODE_ERROR_CODE = 'HEROKU_UNSUPPORTED_NODE'

/**
 * Whether `error` is the load-time crash an unsupported Node version causes:
 * a dependency using newer regex syntax (e.g. the `v` flag) throws a
 * SyntaxError reading "Invalid regular expression flags". Deliberately
 * narrow: other SyntaxErrors (e.g. JSON.parse, or a runtime bad regex
 * pattern) must not match. Fails open (false) when the version can't be
 * parsed.
 */
export function isUnsupportedNodeCrash(nodeVersion: string, error: unknown): boolean {
  const major = Number.parseInt(String(nodeVersion).replace(/^v/, ''), 10)
  if (Number.isNaN(major) || major >= FIRST_NODE_MAJOR_WITH_V_FLAG) {
    return false
  }

  // Match by name too: the telemetry worker reconstructs errors as plain
  // `Error`s (keeping `name`), so `instanceof SyntaxError` alone would miss it.
  const e = error as null | undefined | {message?: unknown; name?: unknown}
  const isSyntaxError = error instanceof SyntaxError || Boolean(e && e.name === 'SyntaxError')
  return isSyntaxError && typeof (e && e.message) === 'string' && /invalid regular expression flags/i.test(String(e && e.message))
}

/**
 * `enginesRange` is package.json `engines.node`. A plain minimum (`>=20`) reads
 * as "v20 or later"; any other range is shown verbatim rather than parsed, so
 * it can't drift from `engines`. Generic wording when it is missing or not a
 * non-empty string.
 */
export function unsupportedNodeMessage(nodeVersion: string, enginesRange?: string): string {
  const version = String(nodeVersion).replace(/^v/, '')
  let requirement = 'a newer version of Node.js'
  if (typeof enginesRange === 'string' && enginesRange !== '') {
    const minimum = /^>=\s*v?(\d+(?:\.\d+){0,2})$/.exec(enginesRange)
    requirement = minimum
      ? `Node.js v${minimum[1]} or later`
      : `a Node.js version matching ${enginesRange}`
  }

  return `The Heroku CLI doesn't support Node.js v${version}. Upgrade to ${requirement}. `
    + 'Or install the standalone Heroku CLI, which includes its own Node.js. '
    + 'See: https://devcenter.heroku.com/articles/heroku-cli'
}
