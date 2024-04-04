import {stdout, stderr} from 'stdout-stderr'
import * as nock from 'nock'
import * as proxyquire from 'proxyquire'
import {expect} from 'chai'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'
import {apps, personalApp, teamApp} from '../../../helpers/stubs/get'
import {teamAppTransfer} from '../../../helpers/stubs/patch'
import {personalToPersonal} from '../../../helpers/stubs/post'

let Cmd: GenericCmd
let inquirer: {prompt?: (prompts: { choices: any }[]) => void} = {}

describe('heroku apps:transfer', () => {
  beforeEach(() => {
    inquirer = {}
    const {default: proxyCmd} = proxyquire('../../../../src/commands/apps/transfer', {
      inquirer,
      '@noCallThru': true,
    })
    Cmd = proxyCmd
  })
  afterEach(() => nock.cleanAll())
  context('when transferring in bulk', () => {
    beforeEach(() => {
      apps()
    })
    it('transfers selected apps to a team', async () => {
      inquirer.prompt = (prompts: { choices: any }[]) => {
        const choices = prompts[0].choices
        expect(choices).to.eql([
          {
            name: 'my-team-app (team)', value: {name: 'my-team-app', owner: 'team@herokumanager.com'},
          }, {
            name: 'myapp (foo@foo.com)', value: {name: 'myapp', owner: 'foo@foo.com'},
          },
        ])
        return Promise.resolve({choices: [{name: 'myapp', owner: 'foo@foo.com'}]})
      }

      const api = teamAppTransfer()
      await runCommand(Cmd, [
        '--bulk',
        'team',
      ])
      api.done()
      expect(stderr.output).to.include('Warning: Transferring applications to team...\n ›\nTransferring ⬢ myapp...\nTransferring ⬢ myapp... done\n')
    })
    it('transfers selected apps to a personal account', async () => {
      inquirer.prompt = (prompts: { choices: any }[]) => {
        const choices = prompts[0].choices
        expect(choices).to.eql([
          {
            name: 'my-team-app (team)', value: {name: 'my-team-app', owner: 'team@herokumanager.com'},
          }, {
            name: 'myapp (foo@foo.com)', value: {name: 'myapp', owner: 'foo@foo.com'},
          },
        ])
        return Promise.resolve({choices: [{name: 'myapp', owner: 'foo@foo.com'}]})
      }

      const api = personalToPersonal()
      await runCommand(Cmd, [
        '--bulk',
        'raulb@heroku.com',
      ])
      api.done()
      expect(stderr.output).to.include('Warning: Transferring applications to raulb@heroku.com...\n ›\nInitiating transfer of ⬢ myapp...\nInitiating transfer of ⬢ myapp... email sent\n')
    })
  })
  context('when it is a personal app', () => {
    beforeEach(() => {
      personalApp()
    })
    it('transfers the app to a personal account', async () => {
      const api = personalToPersonal()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'raulb@heroku.com',
      ])
      expect('').to.eq(stdout.output)
      expect('Initiating transfer of ⬢ myapp to raulb@heroku.com...\nInitiating transfer of ⬢ myapp to raulb@heroku.com... email sent\n').to.eq(stderr.output)
      api.done()
    })
    it('transfers the app to a team', async () => {
      const api = teamAppTransfer()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout.output)
      expect('Transferring ⬢ myapp to team...\nTransferring ⬢ myapp to team... done\n').to.eq(stderr.output)
      api.done()
    })
  })
  context('when it is an org app', () => {
    beforeEach(() => {
      teamApp()
    })
    it('transfers the app to a personal account confirming app name', async () => {
      const api = teamAppTransfer()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout.output)
      expect('Transferring ⬢ myapp to team...\nTransferring ⬢ myapp to team... done\n').to.eq(stderr.output)
      api.done()
    })
    it('transfers the app to a team', async () => {
      const api = teamAppTransfer()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout.output)
      expect('Transferring ⬢ myapp to team...\nTransferring ⬢ myapp to team... done\n').to.eq(stderr.output)
      api.done()
    })
    it('transfers and locks the app if --locked is passed', async () => {
      const api = teamAppTransfer()
      const lockedAPI = nock('https://api.heroku.com:443')
        .get('/teams/apps/myapp')
        .reply(200, {name: 'myapp', locked: false})
        .patch('/teams/apps/myapp', {locked: true})
        .reply(200)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--locked',
        'team',
      ])
      expect('').to.eq(stdout.output)
      expect('Transferring ⬢ myapp to team...\nTransferring ⬢ myapp to team... done\nLocking myapp...\nLocking myapp... done\n').to.eq(stderr.output)
      api.done()
      lockedAPI.done()
    })
  })
})
