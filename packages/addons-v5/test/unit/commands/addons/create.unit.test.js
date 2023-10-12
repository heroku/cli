'use strict'
/* globals commands context beforeEach afterEach cli nock */

const cmd = commands.find(c => c.topic === 'addons' && c.command === 'create')
const {expect} = require('chai')
const lolex = require('lolex')
const _ = require('lodash')
const {Config} = require('@oclif/core')
const sinon = require('sinon')
let config

describe('addons:create', () => {
  let api
  const addon = {
    id: 201,
    name: 'db3-swiftly-123',
    addon_service: {name: 'heroku-db3'},
    app: {name: 'myapp', id: 101},
    config_vars: ['DATABASE_URL'],
    plan: {price: {cents: 10000, unit: 'month'}},
    state: 'provisioned',
    provision_message: 'provision message',
  }

  beforeEach(async () => {
    config = await Config.load()
    cli.mockConsole()
    api = nock('https://api.heroku.com')
  })

  afterEach(() => {
    api.done()
    nock.cleanAll()
  })

  context('creating a db with a name', () => {
    beforeEach(() => {
      api.post('/apps/myapp/addons', {
        plan: {name: 'heroku-postgresql:standard-0'},
        name: 'foobar',
        config: {},
        attachment: {},
      })
        .reply(200, addon)
    })

    it('passes name through to the API', () => {
      return cmd.run({
        config,
        app: 'myapp',
        args: ['heroku-postgresql:standard-0'],
        flags: {name: 'foobar'},
      })
        .then(() => api.done())
    })
  })

  context('calling addons:create without a plan', () => {
    it('errors out with usage', () => {
      return cmd.run({
        config,
        app: 'myapp',
        args: [],
        flags: {name: 'foobar'},
      })
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error.message).to.equal('Usage: heroku addons:create SERVICE:PLAN'))
    })
  })

  context('creating a db', () => {
    beforeEach(() => {
      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'},
        config: {follow: 'otherdb', rollback: true, foo: true},
        plan: {name: 'heroku-postgresql:standard-0'},
      })
        .reply(200, addon)
    })

    it('creates an add-on with proper output', () => {
      return cmd.run({
        config,
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow', 'otherdb', '--foo'],
        flags: {as: 'mydb'},
      })
        .then(() => expect(cli.stderr).to.equal('Creating heroku-postgresql:standard-0 on myapp... ~$0.139/hour (max $100/month)\n'))
        .then(() => expect(cli.stdout).to.equal(`provision message
Created db3-swiftly-123 as DATABASE_URL
Use heroku addons:docs heroku-db3 to view documentation
`))
    })

    it('creates an addon with = args', () => {
      return cmd.run({
        config,
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow=otherdb', '--foo'],
        flags: {as: 'mydb'},
      })
    })

    it('turns args value true into literal true, not a string', () => {
      return cmd.run({
        config,
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow=otherdb', '--foo=true'],
        flags: {as: 'mydb'},
      })
    })
  })
  context('when add-on is async', () => {
    context('provisioning message and config vars provided by add-on provider', () => {
      beforeEach(() => {
        const asyncAddon = _.clone(addon)

        asyncAddon.state = 'provisioning'

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {},
          plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)
      })

      it('creates an add-on with output about async provisioning', () => {
        return cmd.run({
          config,
          app: 'myapp',
          args: ['heroku-postgresql:standard-0'],
          flags: {as: 'mydb'},
        })
          .then(() => expect(cli.stderr).to.equal('Creating heroku-postgresql:standard-0 on myapp... ~$0.139/hour (max $100/month)\n'))
          .then(() => expect(cli.stdout).to.equal(`provision message
db3-swiftly-123 is being created in the background. The app will restart when complete...
Use heroku addons:info db3-swiftly-123 to check creation progress
Use heroku addons:docs heroku-db3 to view documentation
`))
      })
    })
    context('and no provision message supplied', () => {
      beforeEach(() => {
        const asyncAddon = _.clone(addon)

        asyncAddon.state = 'provisioning'
        asyncAddon.provision_message = undefined

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {},
          plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)
      })

      it('creates an add-on with output about async provisioning', () => {
        return cmd.run({
          config,
          app: 'myapp',
          args: ['heroku-postgresql:standard-0'],
          flags: {as: 'mydb'},
        })
          .then(() => expect(cli.stderr).to.equal('Creating heroku-postgresql:standard-0 on myapp... ~$0.139/hour (max $100/month)\n'))
          .then(() => expect(cli.stdout).to.equal(`db3-swiftly-123 is being created in the background. The app will restart when complete...
Use heroku addons:info db3-swiftly-123 to check creation progress
Use heroku addons:docs heroku-db3 to view documentation
`))
      })
    })
    context('and no config vars supplied by add-on provider', () => {
      beforeEach(() => {
        const asyncAddon = _.clone(addon)

        asyncAddon.state = 'provisioning'
        asyncAddon.config_vars = undefined

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {},
          plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)
      })

      it('creates an add-on with output about async provisioning', () => {
        return cmd.run({
          config,
          app: 'myapp',
          args: ['heroku-postgresql:standard-0'],
          flags: {as: 'mydb'},
        })
          .then(() => expect(cli.stderr).to.equal('Creating heroku-postgresql:standard-0 on myapp... ~$0.139/hour (max $100/month)\n'))
          .then(() => expect(cli.stdout).to.equal(`provision message
db3-swiftly-123 is being created in the background. The app will restart when complete...
Use heroku addons:info db3-swiftly-123 to check creation progress
Use heroku addons:docs heroku-db3 to view documentation
`))
      })
    })
    context('--wait', () => {
      let clock
      let sandbox

      beforeEach(() => {
        sandbox = sinon.createSandbox()
        clock = lolex.install()
        clock.setTimeout = function (fn) {
          fn()
        }
      })

      afterEach(function () {
        clock.uninstall()
        sandbox.restore()
      })

      it('waits for response and notifies', () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

        const asyncAddon = _.clone(addon)
        asyncAddon.state = 'provisioning'

        const post = api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {wait: true},
          plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)

        const provisioningResponse = api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, asyncAddon)

        const provisionedResponse = api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, addon) // when it has provisioned

        return cmd.run({
          config,
          app: 'myapp',
          args: ['heroku-postgresql:standard-0', '--wait'],
          flags: {as: 'mydb', wait: true},
        })
          .then(() => post.done())
          .then(() => provisioningResponse.done())
          .then(() => provisionedResponse.done())
          .then(() => expect(notifySpy.called).to.equal(true))
          .then(() => expect(notifySpy.calledOnce).to.equal(true))
          .then(() => expect(cli.stderr).to.equal('Creating heroku-postgresql:standard-0 on myapp... ~$0.139/hour (max $100/month)\nCreating db3-swiftly-123... done\n'))
          .then(() => expect(cli.stdout).to.equal(`provision message
Waiting for db3-swiftly-123...
Created db3-swiftly-123 as DATABASE_URL
Use heroku addons:docs heroku-db3 to view documentation
`))
      })

      it('notifies when provisioning failure occurs', () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

        const asyncAddon = _.clone(addon)
        asyncAddon.state = 'provisioning'

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {wait: true},
          plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)

        api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, asyncAddon)

        const deprovisionedAddon = _.clone(addon)
        deprovisionedAddon.state = 'deprovisioned'

        api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, deprovisionedAddon) // failed

        return cmd.run({
          config,
          app: 'myapp',
          args: ['heroku-postgresql:standard-0', '--wait'],
          flags: {as: 'mydb', wait: true},
        })
          .catch(() => {
            expect(notifySpy.called).to.equal(true)
            expect(notifySpy.calledOnce).to.equal(true)
          })
      })
    })
    context('when add-on provision errors', () => {
      it('shows that it failed to provision', function () {
        const deprovisionedAddon = _.clone(addon)
        deprovisionedAddon.state = 'deprovisioned'

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          plan: {name: 'heroku-postgresql:standard-0'},
          config: {},
        })
          .reply(200, deprovisionedAddon) // failed

        const cmdPromise = cmd.run({
          config,
          app: 'myapp',
          args: ['heroku-postgresql:standard-0'],
          flags: {as: 'mydb'},
        })

        return cmdPromise
          .then(() => {
            throw new Error('unreachable')
          })
          .catch(error => {
            expect(error.message).to.equal('The add-on was unable to be created, with status deprovisioned')
          })
      })
    })
  })

  context('creating a db requiring confirmation', () => {
    it('aborts if confirmation does not match', () => {
      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'},
        config: {follow: 'otherdb', rollback: true, foo: true},
        plan: {name: 'heroku-postgresql:standard-0'},
        confirm: 'not-my-app',
      })
        .reply(423,
          {id: 'confirmation_required', message: 'This add-on is not automatically networked with this Private Space. '},
          {'X-Confirmation-Required': 'myapp-confirm'})

      return expect(cmd.run({
        config,
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow', 'otherdb', '--foo'],
        flags: {as: 'mydb', confirm: 'not-my-app'},
      })).to.be.rejectedWith(Error, /Confirmation not-my-app did not match myapp. Aborted./)
    })

    it('succeeds if confirmation does match', () => {
      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'},
        config: {follow: 'otherdb', rollback: true, foo: true},
        plan: {name: 'heroku-postgresql:standard-0'},
        confirm: 'myapp',
      })
        .reply(200, addon)

      return cmd.run({
        config,
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow', 'otherdb', '--foo'],
        flags: {as: 'mydb', confirm: 'myapp'},
      }).then(() => expect(cli.stderr).to.contain('Creating heroku-postgresql:standard-0 on myapp... ~$0.139/hour (max $100/month)\n'))
        .then(() => expect(cli.stdout).to.equal(`provision message
Created db3-swiftly-123 as DATABASE_URL
Use heroku addons:docs heroku-db3 to view documentation
`))
    })
  })

  context('--follow=--otherdb', () => {
    beforeEach(() => {
      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'},
        config: {follow: '--otherdb', rollback: true, foo: true},
        plan: {name: 'heroku-postgresql:standard-0'},
      })
        .reply(200, addon)
    })

    it('creates an addon with =-- args', () => {
      return cmd.run({
        config,
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow=--otherdb', '--foo'],
        flags: {as: 'mydb'},
      })
    })
  })
  context('no config vars supplied by add-on provider', () => {
    beforeEach(() => {
      const noConfigAddon = _.clone(addon)
      noConfigAddon.config_vars = undefined

      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'},
        config: {},
        plan: {name: 'heroku-postgresql:standard-0'},
      })
        .reply(200, noConfigAddon)
    })

    it('creates an add-on without the config vars listed', () => {
      return cmd.run({
        config,
        app: 'myapp',
        args: ['heroku-postgresql:standard-0'],
        flags: {as: 'mydb'},
      })
        .then(() => expect(cli.stderr).to.equal('Creating heroku-postgresql:standard-0 on myapp... ~$0.139/hour (max $100/month)\n'))
        .then(() => expect(cli.stdout).to.equal(`provision message
Created db3-swiftly-123
Use heroku addons:docs heroku-db3 to view documentation
`))
    })
  })
})
