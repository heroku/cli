import {expect} from 'chai'

import {runCliSubprocess} from '../helpers/run-cli-subprocess.js'

describe('access', function () {
  it('shows a table with access status', function () {
    const {stderr, stdout} = runCliSubprocess([
      'access',
      '--app=heroku-cli-ci-smoke-test-app',
    ])
    const out = stdout + stderr
    expect(out).to.match(/admin|collaborator/)
    expect(out).to.include('deploy, manage, operate, view')
  })
})
