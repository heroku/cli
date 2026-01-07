import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('git:clone', function () {
  it('errors if no app given', async () => {
    const {error} = await runCommand(['git:clone'])

    expect(error?.message).to.contain('Missing required flag app')
  })
})
