import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'

import Version from '../../../../src/commands/local/version.js'

describe('local:version', function () {
  it('rejects extra arguments with helpful error', async function () {
    const {error} = await runCommand(Version, ['extra'])

    expect(error?.message).to.equal('Unexpected argument: extra\nSee more help with --help')
  })
})
