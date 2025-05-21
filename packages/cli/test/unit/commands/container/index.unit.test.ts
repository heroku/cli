import {stdout} from 'stdout-stderr'
// import Cmd from '../../../../src/commands/container/index'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import {readFileSync} from 'fs'
import {fileURLToPath} from 'url'
import {dirname, join} from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../../../package.json'), 'utf8'))
const {version} = packageJson

/*
describe('container', function () {
  it('shows package version', async function () {
    await runCommand(Cmd)

    expect(stdout.output).to.equal(`${version}\n`)
  })
})

*/
