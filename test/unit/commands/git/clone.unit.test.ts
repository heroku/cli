import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'

import {GitClone as Clone} from '../../../../src/commands/git/clone.js'

describe('git:clone', function () {
  it('errors if no app given', async function () {
    const {error} = await runCommand(Clone, [])

    expect(error?.message).to.contain('Missing required flag app')
  })
})
