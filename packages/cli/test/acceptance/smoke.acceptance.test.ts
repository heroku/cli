// tslint:disable no-console

import * as fs from 'fs-extra'
import {expect} from 'chai'
import * as path from 'path'
import * as qq from 'qqjs'

import commandsOutput from './commands-output'

const globby = require('globby')

const app = 'heroku-cli-ci-smoke-test-app'
const appFlag = `-a=${app}`
const bin = path.join(__dirname, '../../bin/run')

function run(args = '') {
  console.log(`$ heroku ${args}`)
  return qq.x([bin, args].join(' '), {stdio: undefined})
}

describe('@acceptance smoke tests', () => {
  describe('commands', () => {
    it('heroku access', async () => {
      const {stdout} = await run(`access ${appFlag}`)
      expect(stdout).to.contain('heroku-cli@salesforce.com')
    })

    it('heroku addons', async () => {
      const {stdout} = await run(`addons ${appFlag}`)
      expect(stdout).to.contain('No add-ons for app heroku-cli-ci-smoke-test-app.')
    })

    it('heroku apps', async () => {
      const cmd = await run('apps')
      expect(cmd.stdout).to.contain('You have no apps.')
    })

    it('heroku apps:info', async () => {
      const {stdout} = await run(`info ${appFlag}`)
      expect(stdout).to.contain(app)
    })

    it('heroku auth:whoami', async () => {
      const {stdout} = await run('auth:whoami')
      expect(stdout).to.contain('heroku-cli@salesforce.com')
    })

    it('heroku authorizations', async () => {
      const {stdout} = await run('authorizations')
      expect(stdout).to.contain('global')
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

    it('heroku clients', async () => {
      const {stdout} = await run('clients')
      expect(stdout).to.contain('No OAuth clients.')
    })

    it('heroku config', async () => {
      const {stdout} = await run(`config ${appFlag}`)
      expect(stdout).to.contain('heroku-cli-ci-smoke-test-app Config Vars')
    })

    it('heroku container:login', async () => {
      const {stdout} = await run('container:login')
      expect(stdout).to.contain('Login Succeeded')
    })

    it('heroku domains', async () => {
      const {stdout} = await run(`domains ${appFlag}`)
      expect(stdout).to.contain('heroku-cli-ci-smoke-test-app Heroku Domain')
    })

    it('heroku git:clone', async () => {
      fs.mkdirSync('temp')
      const {stderr} = await run(`git:clone temp ${appFlag}`)
      expect(stderr).to.contain("Cloning into 'temp'")
      fs.removeSync('temp')
    })

    it('heroku help', async () => {
      const {stdout} = await run('help')
      expect(stdout).to.contain('$ heroku [COMMAND]')
    })

    it('heroku local:version', async () => {
      const {stdout} = await run('local:version')
      expect(stdout).to.contain('3.0.1')
    })

    it('heroku pipelines', async () => {
      const {stdout} = await run('pipelines')
      expect(stdout).to.match(/===.*My Pipelines/)
    })

    it('heroku pg:backups', async () => {
      const {stdout} = await run(`pg:backups ${appFlag}`)
      expect(stdout).to.match(/===.*Backups/)
      expect(stdout).to.match(/===.*Restores/)
      expect(stdout).to.match(/===.*Copies/)
    })

    it('heroku redis:credentials', async () => {
      try {
        await run(`redis:credentials ${appFlag}`)
      } catch (error:any) {
        expect(error.message).to.contain('No Redis instances found')
      }
    })

    it('heroku regions', async () => {
      const {stdout} = await run('regions')
      expect(stdout).to.contain('ID')
      expect(stdout).to.contain('Location')
      expect(stdout).to.contain('Runtime')
    })

    it('heroku run', async () => {
      const {stdout} = await run(['run', '--exit-code', appFlag, 'echo', 'it works!'].join(' '))
      expect(stdout).to.contain('it works!')
    })

    it('heroku sessions', async () => {
      const {stdout} = await run('sessions')
      expect(stdout).to.contain('No OAuth sessions.')
    })

    it('heroku spaces', async () => {
      try {
        await run('spaces')
      } catch (error: any) {
        expect(error.message).to.contain('You do not have access to any spaces')
      }
    })

    it('heroku status', async () => {
      const {stdout} = await run('status')
      expect(stdout).to.contain('Apps:')
      expect(stdout).to.contain('Data:')
      expect(stdout).to.contain('Tools:')
    })

    it('heroku version', async () => {
      const {stdout} = await run('version')
      expect(stdout).to.match(/^heroku\//)
    })

    it('heroku webhooks', async () => {
      const {stdout} = await run(`webhooks ${appFlag}`)
      expect(stdout).to.contain('has no webhooks')
    })
  })

  describe('cli general', () => {
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

    // this test will fail when run locally depending on which plugins you have installed
    it('heroku commands', async () => {
      const removeWhiteSpace = (str: string) => str.replace(/\s/g, '')
      const {stdout} = await run('commands')
      expect(removeWhiteSpace(stdout)).to.equal(removeWhiteSpace(commandsOutput))
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
})
