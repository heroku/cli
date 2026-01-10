import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('local:version', function () {
  it('rejects extra arguments with helpful error', async function () {
    const {error} = await runCommand(['local:version', 'extra'])

    expect(error?.message).to.equal('Unexpected argument: extra\nSee more help with --help')
  })
})
