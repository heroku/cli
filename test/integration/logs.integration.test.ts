import {expect} from 'chai'

import {runCliSubprocess} from '../helpers/runCliSubprocess.js'

describe('logs', function () {
  it('shows the logs', function () {
    const {stderr, stdout} = runCliSubprocess([
      'logs',
      '--app=heroku-cli-ci-smoke-test-app',
    ])
    const out = stdout + stderr
    expect(out.startsWith('20') || out.includes('20')).to.be.true
  })
})
