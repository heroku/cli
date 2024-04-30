import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/container/index'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
const {version} = require('../../../../package.json')

describe('container', function () {
  it('shows package version', async function () {
    await runCommand(Cmd)

    expect(stdout.output).to.equal(`${version}\n`)
  })
})
