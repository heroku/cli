'use strict'
/* globals commands it describe context beforeEach afterEach cli nock */

const cmd = commands.find(c => c.topic === 'addons' && c.command === 'create')
const expect = require('unexpected')
const lolex = require('lolex')
const _ = require('lodash')

describe('addons:create', () => {
  let api

  let addon = {
    id: 201,
    name: 'db3-swiftly-123',
    addon_service: {name: 'heroku-db3'},
    app: {name: 'myapp', id: 101},
    config_vars: ['DATABASE_URL'],
    plan: {price: {cents: 10000, unit: 'month'}},
    state: 'provisioned',
    provision_message: 'provision message'
  }

  beforeEach(() => {
    cli.mockConsole()
    api = nock('https://api.heroku.com:443')
  })

  afterEach(() => {
    api.done()
    nock.cleanAll()
  })

  context('creating a db', () => {
    beforeEach(() => {
      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'},
        config: {follow: 'otherdb', rollback: true, foo: true},
        plan: {name: 'heroku-postgresql:standard-0'}
      })
      .reply(200, addon)
    })

    it('creates an add-on with proper output', () => {
      return cmd.run({
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow', 'otherdb', '--foo'],
        flags: {as: 'mydb'}
      })
        .then(() => expect(cli.stderr, 'to equal', 'Creating heroku-postgresql:standard-0 on myapp... $100/month\n'))
        .then(() => expect(cli.stdout, 'to equal', `provision message
Created db3-swiftly-123 as DATABASE_URL
Use heroku addons:docs heroku-db3 to view documentation
`))
    })

    it('creates an addon with = args', () => {
      return cmd.run({
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow=otherdb', '--foo'],
        flags: {as: 'mydb'}
      })
    })
  })
  context('when add-on is async', () => {
    context('provisioning message and config vars provided by add-on provider', () => {
      beforeEach(() => {
        let asyncAddon = _.clone(addon)

        asyncAddon.state = 'provisioning'

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {},
          plan: {name: 'heroku-postgresql:standard-0'}
        })
        .reply(200, asyncAddon)
      })

      it('creates an add-on with output about async provisioning', () => {
        return cmd.run({
          app: 'myapp',
          args: ['heroku-postgresql:standard-0'],
          flags: {as: 'mydb'}
        })
          .then(() => expect(cli.stderr, 'to equal', 'Creating heroku-postgresql:standard-0 on myapp... $100/month\n'))
          .then(() => expect(cli.stdout, 'to equal', `provision message
db3-swiftly-123 is being created in the background. The app will restart when complete...
Use heroku addons:info db3-swiftly-123 to check creation progress
Use heroku addons:docs heroku-db3 to view documentation
`))
      })
    })
    context('and no provision message supplied', () => {
      beforeEach(() => {
        let asyncAddon = _.clone(addon)

        asyncAddon.state = 'provisioning'
        asyncAddon.provision_message = undefined

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {},
          plan: {name: 'heroku-postgresql:standard-0'}
        })
        .reply(200, asyncAddon)
      })

      it('creates an add-on with output about async provisioning', () => {
        return cmd.run({
          app: 'myapp',
          args: ['heroku-postgresql:standard-0'],
          flags: {as: 'mydb'}
        })
          .then(() => expect(cli.stderr, 'to equal', 'Creating heroku-postgresql:standard-0 on myapp... $100/month\n'))
          .then(() => expect(cli.stdout, 'to equal', `db3-swiftly-123 is being created in the background. The app will restart when complete...
Use heroku addons:info db3-swiftly-123 to check creation progress
Use heroku addons:docs heroku-db3 to view documentation
`))
      })
    })
    context('and no config vars supplied by add-on provider', () => {
      beforeEach(() => {
        let asyncAddon = _.clone(addon)

        asyncAddon.state = 'provisioning'
        asyncAddon.config_vars = undefined

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {},
          plan: {name: 'heroku-postgresql:standard-0'}
        })
        .reply(200, asyncAddon)
      })

      it('creates an add-on with output about async provisioning', () => {
        return cmd.run({
          app: 'myapp',
          args: ['heroku-postgresql:standard-0'],
          flags: {as: 'mydb'}
        })
          .then(() => expect(cli.stderr, 'to equal', 'Creating heroku-postgresql:standard-0 on myapp... $100/month\n'))
          .then(() => expect(cli.stdout, 'to equal', `provision message
db3-swiftly-123 is being created in the background. The app will restart when complete...
Use heroku addons:info db3-swiftly-123 to check creation progress
Use heroku addons:docs heroku-db3 to view documentation
`))
      })
    })
    context('--wait', () => {
      let clock
      let post
      let provisioningResponse
      let provisionedResponse

      beforeEach(() => {
        let asyncAddon = _.clone(addon)
        asyncAddon.state = 'provisioning'

        post = api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          config: {wait: true},
          plan: {name: 'heroku-postgresql:standard-0'}
        })
        .reply(200, asyncAddon)

        provisioningResponse = api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, asyncAddon)

        provisionedResponse = api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, addon) // when it has provisioned

        clock = lolex.install()
        clock.setTimeout = function (fn, timeout) { fn() }
      })

      afterEach(function () {
        clock.uninstall()
      })

      it('waits for response', () => {
        return cmd.run({
          app: 'myapp',
          args: ['heroku-postgresql:standard-0', '--wait'],
          flags: {as: 'mydb', wait: true}
        })
          .then(() => post.done())
          .then(() => provisioningResponse.done())
          .then(() => provisionedResponse.done())
          .then(() => expect(cli.stderr, 'to equal', 'Creating heroku-postgresql:standard-0 on myapp... $100/month\nCreating db3-swiftly-123... done\n'))
          .then(() => expect(cli.stdout, 'to equal', `provision message
Waiting for db3-swiftly-123...
Created db3-swiftly-123 as DATABASE_URL
Use heroku addons:docs heroku-db3 to view documentation
`))
      })
    })
    context('when add-on provision errors', () => {
      it('shows that it failed to provision', function () {
        let deprovisionedAddon = _.clone(addon)
        deprovisionedAddon.state = 'deprovisioned'

        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'},
          plan: {name: 'heroku-postgresql:standard-0'}
        })
        .reply(200, deprovisionedAddon) // failed

        let cmdPromise = cmd.run({
          app: 'myapp',
          args: ['heroku-postgresql:standard-0'],
          flags: {as: 'mydb'}
        })

        expect(cmdPromise, 'to be rejected with', 'The add-on was unable to be created, with status deprovisioned')
      })
    })
  })

  context('--follow=--otherdb', () => {
    beforeEach(() => {
      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'},
        config: {follow: '--otherdb', rollback: true, foo: true},
        plan: {name: 'heroku-postgresql:standard-0'}
      })
      .reply(200, addon)
    })

    it('creates an addon with =-- args', () => {
      return cmd.run({
        app: 'myapp',
        args: ['heroku-postgresql:standard-0', '--rollback', '--follow=--otherdb', '--foo'],
        flags: {as: 'mydb'}
      })
    })
  })
  context('no config vars supplied by add-on provider', () => {
    beforeEach(() => {
      let noConfigAddon = _.clone(addon)
      noConfigAddon.config_vars = undefined

      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'},
        config: {},
        plan: {name: 'heroku-postgresql:standard-0'}
      })
      .reply(200, noConfigAddon)
    })

    it('creates an add-on without the config vars listed', () => {
      return cmd.run({
        app: 'myapp',
        args: ['heroku-postgresql:standard-0'],
        flags: {as: 'mydb'}
      })
        .then(() => expect(cli.stderr, 'to equal', 'Creating heroku-postgresql:standard-0 on myapp... $100/month\n'))
        .then(() => expect(cli.stdout, 'to equal', `provision message
Created db3-swiftly-123
Use heroku addons:docs heroku-db3 to view documentation
`))
    })
  })
})
