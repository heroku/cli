'use strict'
/* globals describe it beforeEach afterEach cli nock context expect */

let cmd
let inquirer = {}
let stubGet = require('../../stub/get')
let stubPost = require('../../stub/post')
let stubPatch = require('../../stub/patch')
let proxyquire = require('proxyquire').noCallThru()

describe('heroku apps:transfer', () => {
  beforeEach(() => {
    cli.mockConsole()
    inquirer = {}
    cmd = proxyquire('../../../commands/apps/transfer', { inquirer })[0]
  })

  afterEach(() => nock.cleanAll())

  context('when transferring in bulk', () => {
    beforeEach(() => {
      stubGet.apps()
    })

    it('transfers selected apps to a team', async () => {
      inquirer.prompt = (prompts) => {
        let choices = prompts[0].choices
        expect(choices).to.eql([
          {
            name: 'my-team-app (team)',
            value: { name: 'my-team-app', owner: 'team@herokumanager.com' }
          },
          {
            name: 'myapp (foo@foo.com)',
            value: { name: 'myapp', owner: 'foo@foo.com' }
          }
        ])
        return Promise.resolve({ choices: [{ name: 'myapp', owner: 'foo@foo.com' }] })
      }

      let api = stubPatch.teamAppTransfer()
      await cmd.run({ args: { recipient: 'team' }, flags: { bulk: true } })
      api.done()
      expect(cli.stderr).to.equal(`Transferring applications to team...

Transferring myapp... done
`)
    })

    it('transfers selected apps to a personal account', async () => {
      inquirer.prompt = (prompts) => {
        let choices = prompts[0].choices
        expect(choices).to.eql([
          {
            name: 'my-team-app (team)',
            value: { name: 'my-team-app', owner: 'team@herokumanager.com' }
          },
          {
            name: 'myapp (foo@foo.com)',
            value: { name: 'myapp', owner: 'foo@foo.com' }
          }
        ])
        return Promise.resolve({ choices: [{ name: 'myapp', owner: 'foo@foo.com' }] })
      }

      let api = stubPost.personalToPersonal()
      await cmd.run({ args: { recipient: 'raulb@heroku.com' }, flags: { bulk: true } })
      api.done()
      expect(cli.stderr).to.equal(`Transferring applications to raulb@heroku.com...

Initiating transfer of myapp... email sent
`)
    })
  })

  context('when it is a personal app', () => {
    beforeEach(() => {
      stubGet.personalApp()
    })

    it('transfers the app to a personal account', async () => {
      let api = stubPost.personalToPersonal()

      await cmd.run({ app: 'myapp', args: { recipient: 'raulb@heroku.com' }, flags: {} })

      expect('').to.eq(cli.stdout);

      expect(`Initiating transfer of myapp to raulb@heroku.com... email sent
`).to.eq(cli.stderr);

      return api.done()
    })

    it('transfers the app to a team', async () => {
      let api = stubPatch.teamAppTransfer()

      await cmd.run({ app: 'myapp', args: { recipient: 'team' }, flags: {} })

      expect('').to.eq(cli.stdout);

      expect(`Transferring myapp to team... done
`).to.eq(cli.stderr);

      return api.done()
    })
  })

  context('when it is an org app', () => {
    beforeEach(() => {
      stubGet.teamApp()
    })

    it('transfers the app to a personal account confirming app name', async () => {
      let api = stubPatch.teamAppTransfer()

      await cmd.run({ app: 'myapp', args: { recipient: 'team' }, flags: { confirm: 'myapp' } })

      expect('').to.eq(cli.stdout);

      expect(`Transferring myapp to team... done
`).to.eq(cli.stderr);

      return api.done()
    })

    it('transfers the app to a team', async () => {
      let api = stubPatch.teamAppTransfer()

      await cmd.run({ app: 'myapp', args: { recipient: 'team' }, flags: {} })

      expect('').to.eq(cli.stdout);

      expect(`Transferring myapp to team... done
`).to.eq(cli.stderr);

      return api.done()
    })

    it('transfers and locks the app if --locked is passed', async () => {
      let api = stubPatch.teamAppTransfer()

      let lockedAPI = nock('https://api.heroku.com:443')
        .get('/teams/apps/myapp')
        .reply(200, { name: 'myapp', locked: false })
        .patch('/teams/apps/myapp', { locked: true })
        .reply(200)

      await cmd.run({ app: 'myapp', args: { recipient: 'team' }, flags: { locked: true } })

      expect('').to.eq(cli.stdout);

      expect(`Transferring myapp to team... done
Locking myapp... done
`).to.eq(cli.stderr);

      api.done();

      return lockedAPI.done()
    })
  })
})
