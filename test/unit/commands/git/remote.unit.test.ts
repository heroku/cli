import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'

import {GitRemote as Remote} from '../../../../src/commands/git/remote.js'

describe('git:remote', function () {
  it('errors if no app given', async function () {
    const {error} = await runCommand(Remote, [])

    expect(error?.message).to.contain('Specify an app with --app')
  })
})
