// tslint:disable no-console

import {expect} from 'chai'
import * as path from 'path'
import * as qq from 'qqjs'

const globby = require('globby')

const app = 'heroku-cli-ci-smoke-test-app'
const appFlag = `-a=${app}`
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
    const {stdout} = await run(`info ${appFlag}`)
    expect(stdout).to.contain(app)
  })

  it('heroku run', async () => {
    const {stdout} = await run(['run', '--exit-code', appFlag, 'echo', 'it works!'].join(' '))
    expect(stdout).to.contain('it works!')
  })

  it('heroku access', async () => {
    const {stdout} = await run(`access ${appFlag}`)
    expect(stdout).to.contain('heroku-cli@salesforce.com')
  })

  it('heroku pg:backups', async () => {
    const {stdout} = await run(`pg:backups ${appFlag}`)
    expect(stdout).to.match(/===.*Backups/)
    expect(stdout).to.match(/===.*Restores/)
    expect(stdout).to.match(/===.*Copies/)
  })

  it('heroku pipelines', async () => {
    const {stdout} = await run('pipelines')
    expect(stdout).to.match(/===.*My Pipelines/)
  })

  it('heroku status', async () => {
    const {stdout} = await run('status')
    expect(stdout).to.contain('Apps:')
    expect(stdout).to.contain('Data:')
    expect(stdout).to.contain('Tools:')
  })

  it('heroku webhooks', async () => {
    const {stdout} = await run(`webhooks ${appFlag}`)
    expect(stdout).to.contain('has no webhooks')
  })

  it('heroku auth:whoami', async () => {
    const {stdout} = await run('auth:whoami')
    expect(stdout).to.contain('heroku-cli@salesforce.com')
  })

  it('heroku autocomplete', async () => {
    const {stdout} = await run('autocomplete bash')
    expect(stdout).to.contain('Setup Instructions for HEROKU CLI Autocomplete')
  })

  it('heroku buildpacks:search', async () => {
    const {stdout} = await run('buildpacks:search ruby')
    expect(stdout).to.contain('Buildpack')
    expect(stdout).to.contain('Category')
    expect(stdout).to.contain('Description')
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

  it('heroku certs', async () => {
    const {stdout} = await run(`certs ${appFlag}`)
    expect(stdout).to.contain('has no SSL certificates')
  })

  it('heroku ci', async () => {
    const {stdout} = await run(`ci ${appFlag}`)
    expect(stdout).to.contain('Showing latest test runs for the smoke-test-app-ci pipeline')
  })

  it('heroku ci:config', async () => {
    const {stdout} = await run(`ci:config ${appFlag}`)
    expect(stdout).to.contain('smoke-test-app-ci test config vars')
  })

  it('heroku addons', async () => {
    const {stdout} = await run(`addons ${appFlag}`)
    expect(stdout).to.contain('No add-ons for app heroku-cli-ci-smoke-test-app.')
  })

  it('heroku domains', async () => {
    const {stdout} = await run(`domains ${appFlag}`)
    expect(stdout).to.contain('heroku-cli-ci-smoke-test-app Heroku Domain')
  })

  it('heroku apps', async () => {
    const {stdout} = await run('apps -p')
    expect(stdout).to.contain('Collaborated Apps')
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
