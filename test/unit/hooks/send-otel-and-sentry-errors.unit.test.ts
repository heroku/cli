import {expect} from 'chai'

import {isUserError} from '../../../src/hooks/finally/send-otel-and-sentry-errors.js'

describe('send-otel-and-sentry-errors finally hook: isUserError', function () {
  it('filters out the non-interactive login error by code (W-22403348)', function () {
    const error = Object.assign(new Error('Cannot prompt for login in a non-interactive terminal.'), {
      code: 'HEROKU_NONINTERACTIVE_LOGIN',
      oclif: {exit: 1},
    })
    expect(isUserError(error)).to.equal(true)
  })

  it('filters out 4xx errors', function () {
    expect(isUserError({statusCode: 404})).to.equal(true)
    expect(isUserError({http: {statusCode: 422}})).to.equal(true)
  })

  it('filters out command-not-found and exit 127', function () {
    expect(isUserError({message: 'Run heroku help for a list of available commands.'})).to.equal(true)
    expect(isUserError({oclif: {exit: 127}})).to.equal(true)
  })

  it('does NOT filter genuine bugs (unrelated code, no 4xx, exit 1)', function () {
    const bug = Object.assign(new Error('process.stdin.setRawMode is not a function'), {oclif: {exit: 1}})
    expect(isUserError(bug)).to.equal(false)
    expect(isUserError({statusCode: 500})).to.equal(false)
    expect(isUserError({code: 'SOME_OTHER_CODE'})).to.equal(false)
  })
})
