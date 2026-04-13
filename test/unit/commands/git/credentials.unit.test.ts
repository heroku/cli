import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'

import {GitCredentials as Credentials} from '../../../../src/commands/git/credentials.js'

describe('git:credentials', function () {
  it('errors if no app given', async function () {
    const {error} = await runCommand(Credentials, [])

    expect(error?.message).to.contain('Missing 1 required arg')
  })
})
