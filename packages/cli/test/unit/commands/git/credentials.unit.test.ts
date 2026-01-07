import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('git:credentials', function () {
  it('errors if no app given', async () => {
    const {error} = await runCommand(['git:credentials'])

    expect(error?.message).to.contain('Missing 1 required arg')
  })
})
