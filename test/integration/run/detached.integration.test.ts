import ansis from 'ansis'
import {expect} from 'chai'

import {runCliSubprocess} from '../../helpers/runCliSubprocess.js'

describe('run:detached', function () {
  it('runs a command', function () {
    const {stderr, stdout} = runCliSubprocess([
      'run:detached',
      '--app=heroku-cli-ci-smoke-test-app',
      'echo',
      '1',
      '2',
      '3',
    ])
    const out = ansis.strip(stdout + stderr)
    expect(out).to.include('Run heroku logs --app heroku-cli-ci-smoke-test-app --dyno')
  })
})
