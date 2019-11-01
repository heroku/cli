// tslint:disable no-console

import {expect} from 'chai'
// import * as _ from 'lodash'
import * as path from 'path'
import * as qq from 'qqjs'

const bin = path.join(__dirname, '../../bin/run')

function run(args = '') {
  console.log(`$ heroku ${args}`)
  return qq.x([bin, args].join(' '), {stdio: undefined})
}

describe('smoke', () => {
  it('heroku version', async () => {
    const {stdout} = await run('version')
    expect(stdout).to.match(/^heroku\//)
  })

  it('heroku help', async () => {
    const {stdout} = await run('help')
    expect(stdout).to.contain('$ heroku [COMMAND]')
  })

  it('heroku apps && heroku apps:info && heroku run', async () => {
    let cmd = await run('apps')
    expect(cmd.stdout).to.match(/^===.*Apps/)
    const app = 'heroku-cli-ci-smoke-test-app'
    const appFlag = `-a=${app}`
    expect((await run(['info', appFlag].join(' '))).stdout).to.contain(`=== ${app}`)
    expect((await run(['run', '--exit-code', appFlag, 'echo', 'it works!'].join(' '))).stdout).to.match(/^it works!/)
  })
})
