// tslint:disable no-console

import {expect} from 'chai'
import * as path from 'path'
import * as qq from 'qqjs'

const globby = require('globby')

const bin = path.join(__dirname, '../../bin/run')

function run(args = '') {
  console.log(`$ heroku ${args}`)
  return qq.x([bin, args].join(' '), {stdio: undefined})
}

describe('@acceptance smoke tests', () => {
  it('heroku version', async () => {
    const {stdout} = await run('version')
    expect(stdout).to.match(/^heroku\//)
  })

  it('heroku help', async () => {
    const {stdout} = await run('help')
    expect(stdout).to.contain('$ heroku [COMMAND]')
  })

  it('heroku apps', async () => {
    const cmd = await run('apps')
    expect(cmd.stdout).to.contain('You have no apps.')
  })

  it('heroku apps:info', async () => {
    const app = 'heroku-cli-ci-smoke-test-app'
    const appFlag = `-a=${app}`
    expect((await run(['info', appFlag].join(' '))).stdout).to.contain(app)
  })

  it('heroku run', async () => {
    const app = 'heroku-cli-ci-smoke-test-app'
    const appFlag = `-a=${app}`
    const {stdout} = await run(['run', '--exit-code', appFlag, 'echo', 'it works!'].join(' '))
    expect(stdout).to.contain('it works!')
  })

  it('heroku access', async () => {
    const app = 'heroku-cli-ci-smoke-test-app'
    const appFlag = `-a=${app}`
    const {stdout} = await run(['access', appFlag].join(' '))
    expect(stdout).to.contain('heroku-cli@salesforce.com')
  })

  // TODO: turn this test back on once the issue with listing plugins is fixed
  it.skip('asserts oclif plugins are in core', async () => {
    const cmd = await run('plugins --core')
    expect(cmd.stdout).to.contain('@oclif/plugin-commands')
    expect(cmd.stdout).to.contain('@oclif/plugin-help')
    expect(cmd.stdout).to.contain('@oclif/plugin-legacy')
    expect(cmd.stdout).to.contain('@oclif/plugin-not-found')
    expect(cmd.stdout).to.contain('@oclif/plugin-plugins')
    expect(cmd.stdout).to.contain('@oclif/plugin-update')
    expect(cmd.stdout).to.contain('@oclif/plugin-warn-if-update-available')
    expect(cmd.stdout).to.contain('@oclif/plugin-which')
  })

  it('asserts monorepo plugins are in core', async () => {
    let paths = await globby(['packages/*/package.json'])
    const cmd = await run('plugins --core')
    paths = paths.map((p: string) => p.replace('packages/', '').replace('/package.json', ''))
    console.log(paths)
    paths = paths.filter((p: string) => p === 'cli')
    paths.forEach((plugin: string) => {
      expect(cmd.stdout).to.contain(plugin)
    })
  })
})
