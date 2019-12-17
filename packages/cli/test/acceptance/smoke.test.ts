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

describe('smoke', () => {
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
    expect(cmd.stdout).to.match(/^===.*Apps/)
  })

  it('heroku apps:info', async () => {
    const app = 'heroku-cli-ci-smoke-test-app'
    const appFlag = `-a=${app}`
    expect((await run(['info', appFlag].join(' '))).stdout).to.contain(`=== ${app}`)
  })

  it('heroku run', async () => {
    const app = 'heroku-cli-ci-smoke-test-app'
    const appFlag = `-a=${app}`
    const {stdout} = await run(['run', '--exit-code', appFlag, 'echo', 'it works!'].join(' '))
    expect(stdout).to.contain('it works!')
  })

  it('asserts oclif plugins are in core', async () => {
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
