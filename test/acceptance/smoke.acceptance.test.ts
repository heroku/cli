// tslint:disable no-console
import ansis from 'ansis'
import fs from 'fs-extra'
import {expect} from 'chai'
import * as path from 'path'
import * as qq from 'qqjs'
import globby from 'globby'
import {fileURLToPath} from 'url'

import commandsOutput from './commands-output.js'
import normalizeTableOutput from '../helpers/utils/normalizeTableOutput.js'

const app = 'heroku-cli-ci-smoke-test-app'
const appFlag = `-a=${app}`
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bin = path.join(__dirname, '../../bin/run')

function run(args = '') {
  console.log(`$ heroku ${args}`)
  return qq.x([bin, args].join(' '), {stdio: undefined})
}

// Smoke tests expect the CI account: heroku-cli@salesforce.com, app heroku-cli-ci-smoke-test-app,
// and account state (e.g. no apps, no OAuth clients/sessions) as asserted. Run in CI or with that account.
describe('@acceptance smoke tests', function () {
  describe('commands', function () {
    it('heroku access', async function () {
      const {stdout} = await run(`access ${appFlag}`)
      expect(stdout).to.contain('heroku-cli@salesforce.com')
    })

    it('heroku addons', async function () {
      const {stdout} = await run(`addons ${appFlag}`)
      expect(stdout).to.contain('No add-ons for app heroku-cli-ci-smoke-test-app.')
    })

    it('heroku apps', async function () {
      const cmd = await run('apps')
      const out = ansis.strip(cmd.stdout)
      expect(out.includes('You have no apps.') || out.includes('Apps')).to.be.true
    })

    it('heroku apps:info', async function () {
      const {stdout} = await run(`info ${appFlag}`)
      expect(stdout).to.contain(app)
    })

    it('heroku auth:whoami', async function () {
      const {stdout} = await run('auth:whoami')
      const out = ansis.strip(stdout).trim()
      expect(out).to.match(/^.+@.+\..+$/)
    })

    it('heroku authorizations', async function () {
      const {stdout} = await run('authorizations')
      expect(stdout).to.contain('global')
    })

    it('heroku autocomplete', async function () {
      const {stdout} = await run('autocomplete bash')
      expect(stdout).to.contain('Setup Instructions for HEROKU CLI Autocomplete')
    })

    it('heroku buildpacks:search', async function () {
      const {stdout} = await run('buildpacks:search ruby')
      expect(stdout).to.contain('Buildpack')
      expect(stdout).to.contain('Category')
      expect(stdout).to.contain('Description')
    })

    it('heroku certs', async function () {
      const {stdout} = await run(`certs ${appFlag}`)
      expect(stdout).to.contain('has no SSL certificates')
    })

    it('heroku ci', async function () {
      const {stdout} = await run(`ci ${appFlag}`)
      expect(ansis.strip(stdout)).to.contain('Showing latest test runs for the smoke-test-app-ci pipeline')
    })

    it('heroku ci:config', async function () {
      const {stdout} = await run(`ci:config ${appFlag}`)
      expect(ansis.strip(stdout)).to.contain('smoke-test-app-ci test config vars')
    })

    it('heroku clients', async function () {
      const {stdout} = await run('clients')
      const out = ansis.strip(stdout)
      expect(out.includes('No OAuth clients.') || (out.includes('name') && out.includes('id'))).to.be.true
    })

    it('heroku config', async function () {
      const {stdout} = await run(`config ${appFlag}`)
      expect(ansis.strip(stdout)).to.contain('heroku-cli-ci-smoke-test-app Config Vars')
    })

    it('heroku container:login', async function () {
      const {stdout} = await run('container:login')
      expect(stdout).to.contain('Login Succeeded')
    })

    it('heroku domains', async function () {
      const {stdout} = await run(`domains ${appFlag}`)
      expect(ansis.strip(stdout)).to.contain('heroku-cli-ci-smoke-test-app Heroku Domain')
    })

    it('heroku git:clone', async function () {
      fs.mkdirSync('temp')
      const {stderr} = await run(`git:clone temp ${appFlag}`)
      expect(stderr).to.contain("Cloning into 'temp'")
      fs.removeSync('temp')
    })

    it('heroku help', async function () {
      const {stdout} = await run('help')
      expect(stdout).to.contain('$ heroku [COMMAND]')
    })

    it('heroku local:version', async function () {
      const {stdout} = await run('local:version')
      expect(stdout).to.contain('3.0.1')
    })

    it('heroku pipelines', async function () {
      const {stdout} = await run('pipelines')
      expect(stdout).to.match(/===.*My Pipelines/)
    })

    it('heroku pg:backups', async function () {
      const {stdout} = await run(`pg:backups ${appFlag}`)
      expect(stdout).to.match(/===.*Backups/)
      expect(stdout).to.match(/===.*Restores/)
      expect(stdout).to.match(/===.*Copies/)
    })

    it('heroku redis:credentials', async function () {
      try {
        await run(`redis:credentials ${appFlag}`)
      } catch (error:any) {
        expect(error.message).to.contain('No Redis instances found')
      }
    })

    it('heroku regions', async function () {
      const {stdout} = await run('regions')
      expect(stdout).to.contain('ID')
      expect(stdout).to.contain('Location')
      expect(stdout).to.contain('Runtime')
    })

    it('heroku run', async function () {
      const {stdout} = await run(['run', '--size=private-s', '--exit-code', appFlag, 'echo', 'it works!'].join(' '))
      expect(stdout).to.contain('it works!')
    })

    it('heroku sessions', async function () {
      const {stdout} = await run('sessions')
      const out = ansis.strip(stdout)
      expect(out.includes('No OAuth sessions.') || (out.includes('Description') && out.includes('ID'))).to.be.true
    })

    it('heroku spaces', async function () {
      try {
        await run('spaces')
      } catch (error: any) {
        expect(error.message).to.contain('You do not have access to any spaces')
      }
    })

    it('heroku status', async function () {
      const {stdout} = await run('status')
      expect(stdout).to.contain('Apps:')
      expect(stdout).to.contain('Data:')
      expect(stdout).to.contain('Tools:')
    })

    it('heroku version', async function () {
      const {stdout} = await run('version')
      expect(stdout).to.match(/^heroku\//)
    })

    it('heroku webhooks', async function () {
      const {stdout} = await run(`webhooks ${appFlag}`)
      expect(stdout).to.contain('has no webhooks')
    })
  })

  describe('cli general', function () {
    it('asserts oclif plugins are in core', async function () {
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

    it('heroku commands', async function () {
      const {stdout} = await run('commands')
      const normalizedOutput = normalizeTableOutput(stdout).replace(/\s+/g, ' ')
      const commandsOutputByLine = commandsOutput.split('\n')
      for (const line of commandsOutputByLine) {
        const normalizedLine = normalizeTableOutput(line).replace(/\s+/g, ' ').trim()
        if (!normalizedLine || normalizedLine === 'id summary' || normalizedLine === 'command summary') continue
        expect(normalizedOutput, `'${normalizedLine}' was expected but wasn't found`).to.include(normalizedLine)
      }
    })
  })
})
