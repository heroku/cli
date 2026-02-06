import {expect} from 'chai'

import {runCliSubprocess} from '../helpers/runCliSubprocess.js'

describe('access', function () {
  it('shows a table with access status', function () {
    const {stdout, stderr} = runCliSubprocess([
      'access',
      '--app=heroku-cli-ci-smoke-test-app',
    ])
    const out = stdout + stderr
    expect(out).to.include('admin')
    expect(out).to.include('deploy, manage, operate, view')
  })
})
