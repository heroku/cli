import {NotFoundError} from '@heroku/heroku-fetch'
import {AddonNotFoundError} from '@heroku/sdk/resources/platform/add-on'
import {expect} from 'chai'

import {isNotFound} from '../../../../src/lib/addons/addons-wait.js'

// `isNotFound` classifies the 404s the deprovisioning poll loops rely on. These
// cases assert it against REAL error instances so the test fails if either SDK
// error type stops exposing its 404 in a shape the helper understands (guards
// against future SDK shape drift), plus the nested http.statusCode shape.
describe('isNotFound', function () {
  it('returns true for a real AddonNotFoundError', function () {
    expect(isNotFound(new AddonNotFoundError())).to.be.true
  })

  it('returns true for a real heroku-fetch NotFoundError', function () {
    expect(isNotFound(new NotFoundError(new Response('', {status: 404})))).to.be.true
  })

  it('returns true for a 404 nested under http.statusCode', function () {
    expect(isNotFound({http: {statusCode: 404}})).to.be.true
  })

  it('returns false for a non-404 error', function () {
    expect(isNotFound(Object.assign(new Error('Boom'), {statusCode: 500}))).to.be.false
  })

  it('returns false for null/undefined/non-object', function () {
    expect(isNotFound(null)).to.be.false
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(isNotFound(undefined)).to.be.false
    expect(isNotFound('nope')).to.be.false
  })
})
