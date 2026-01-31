import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('auth:logout', function () {
  it('shows cli logging user out', async function () {
    const {stderr} = await runCommand(['logout'])
    expect(stderr).to.equal('Logging out... done\n')
  })
})
