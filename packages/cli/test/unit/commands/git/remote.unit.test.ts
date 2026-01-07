import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('git:remote', function () {
  it('errors if no app given', async () => {
    const {error} = await runCommand(['git:remote'])

    expect(error?.message).to.contain('Specify an app with --app')
  })
})
