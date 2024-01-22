import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/addons/create'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as _ from 'lodash'
import * as sinon from 'sinon'
import * as nock from 'nock'
import stripAnsi = require('strip-ansi')
const lolex = require('lolex')

describe('addons:create', () => {
  let api: ReturnType<typeof nock>
  const addon = {
    id: 201, name: 'db3-swiftly-123', addon_service: {name: 'heroku-db3'}, app: {name: 'myapp', id: 101}, config_vars: ['DATABASE_URL'], plan: {price: {cents: 10000, unit: 'month'}}, state: 'provisioned', provision_message: 'provision message',
  }
  beforeEach(async () => {
    api = nock('https://api.heroku.com:443')
  })
  afterEach(() => {
    api.done()
    nock.cleanAll()
  })
  context('creating a db with a name', () => {
    beforeEach(() => {
      api.post('/apps/myapp/addons', {
        plan: {name: 'heroku-postgresql:standard-0'}, name: 'foobar', attachment: {}, config: {},
      })
        .reply(200, addon)
    })
    it('passes name through to the API', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--name',
        'foobar',
        'heroku-postgresql:standard-0',
      ])
    })
  })
  context('calling addons:create without a plan', () => {
    it('errors out with usage', async () => {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--name',
        'foobar',
      ])
        .catch((error: any) => {
          expect(error.message).to.equal('Missing 1 required arg:\n' +
            'service:plan\n' +
            'See more help with --help')
        })
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
    it('creates an add-on with proper output', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow',
        'otherdb',
        '--foo',
      ])
      expect(stderr.output).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)\n')
      expect(stdout.output).to.equal('provision message\nCreated db3-swiftly-123 as DATABASE_URL\nUse heroku addons:docs heroku-db3 to view documentation\n')
    })
    it('creates an addon with = args', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow=otherdb',
        '--foo',
      ])
    })
    it('turns args value true into literal true, not a string', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow=otherdb',
        '--foo=true',
      ])
    })
  })
  context('when add-on is async', () => {
    context('provisioning message and config vars provided by add-on provider', () => {
      beforeEach(() => {
        const asyncAddon = {..._.clone(addon), state: 'provisioning'}
        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'}, config: {}, plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)
      })
      it('creates an add-on with output about async provisioning', async () => {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          'heroku-postgresql:standard-0',
        ])
        expect(stderr.output).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)\n')
        expect(stdout.output).to.equal('provision message\ndb3-swiftly-123 is being created in the background. The app will restart when complete...\nUse heroku addons:info db3-swiftly-123 to check creation progress\nUse heroku addons:docs heroku-db3 to view documentation\n')
      })
    })
    context('and no provision message supplied', () => {
      beforeEach(() => {
        const asyncAddon = {..._.clone(addon), state: 'provisioning', provision_message: undefined}
        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'}, config: {}, plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)
      })
      it('creates an add-on with output about async provisioning', async () => {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          'heroku-postgresql:standard-0',
        ])
        expect(stderr.output).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)\n')
        expect(stdout.output).to.equal('db3-swiftly-123 is being created in the background. The app will restart when complete...\nUse heroku addons:info db3-swiftly-123 to check creation progress\nUse heroku addons:docs heroku-db3 to view documentation\n')
      })
    })
    context('and no config vars supplied by add-on provider', () => {
      beforeEach(() => {
        const asyncAddon = {..._.clone(addon), state: 'provisioning', config_vars: undefined}
        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'}, config: {}, plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)
      })
      it('creates an add-on with output about async provisioning', async () => {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          'heroku-postgresql:standard-0',
        ])
        expect(stderr.output).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)\n')
        expect(stdout.output).to.equal('provision message\ndb3-swiftly-123 is being created in the background. The app will restart when complete...\nUse heroku addons:info db3-swiftly-123 to check creation progress\nUse heroku addons:docs heroku-db3 to view documentation\n')
      })
    })
    context('--wait', () => {
      let clock: ReturnType<typeof lolex.install>
      let sandbox: ReturnType<typeof sinon.createSandbox>
      beforeEach(() => {
        sandbox = sinon.createSandbox()
        clock = lolex.install()
        clock.setTimeout = function (fn: () => unknown) {
          fn()
        }
      })
      afterEach(function () {
        clock.uninstall()
        sandbox.restore()
      })
      it('waits for response and notifies', async () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
        const asyncAddon = {..._.clone(addon), state: 'provisioning'}
        const post = api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'}, config: {wait: true}, plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)
        const provisioningResponse = api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, asyncAddon)
        const provisionedResponse = api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, addon)
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          '--wait',
          'heroku-postgresql:standard-0',
          '--',
          '--wait',
        ])
        expect(notifySpy.called).to.equal(true)
        expect(notifySpy.calledOnce).to.equal(true)
        expect(stderr.output).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)\nCreating db3-swiftly-123...')
        expect(stderr.output).to.contain('done\n')
        expect(stdout.output).to.equal('provision message\nWaiting for db3-swiftly-123...\nCreated db3-swiftly-123 as DATABASE_URL\nUse heroku addons:docs heroku-db3 to view documentation\n')
        post.done()
        provisioningResponse.done()
        provisionedResponse.done()
      })
      it('notifies when provisioning failure occurs', () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
        const asyncAddon = _.clone(addon)
        asyncAddon.state = 'provisioning'
        api.post('/apps/myapp/addons', {
          attachment: {name: 'mydb'}, config: {wait: true}, plan: {name: 'heroku-postgresql:standard-0'},
        })
          .reply(200, asyncAddon)
        api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, asyncAddon)
        const deprovisionedAddon = _.clone(addon)
        deprovisionedAddon.state = 'deprovisioned'
        api.get('/apps/myapp/addons/db3-swiftly-123')
          .reply(200, deprovisionedAddon)
        return runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          '--wait',
          'heroku-postgresql:standard-0',
          '--',
          '--wait',
        ])
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
          attachment: {name: 'mydb'}, plan: {name: 'heroku-postgresql:standard-0'}, config: {},
        })
          .reply(200, deprovisionedAddon)
        const cmdPromise = runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          'heroku-postgresql:standard-0',
        ])
        return cmdPromise.then(() => {
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
        attachment: {name: 'mydb'}, config: {follow: 'otherdb', rollback: true, foo: true}, plan: {name: 'heroku-postgresql:standard-0'}, confirm: 'not-my-app',
      })
        .reply(423, {id: 'confirmation_required', message: 'This add-on is not automatically networked with this Private Space. '}, {'X-Confirmation-Required': 'myapp-confirm'})

      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        '--confirm',
        'not-my-app',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow',
        'otherdb',
        '--foo',
      ])
        .catch(error => {
          expect(stripAnsi(error.message)).to.equal('Confirmation not-my-app did not match myapp. Aborted.')
        })
    })
    it('succeeds if confirmation does match', async () => {
      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'}, config: {follow: 'otherdb', rollback: true, foo: true}, plan: {name: 'heroku-postgresql:standard-0'}, confirm: 'myapp',
      })
        .reply(200, addon)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        '--confirm',
        'myapp',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow',
        'otherdb',
        '--foo',
      ])
      expect(stderr.output).to.contain('\nCreating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)\n')
      expect(stdout.output).to.equal('provision message\nCreated db3-swiftly-123 as DATABASE_URL\nUse heroku addons:docs heroku-db3 to view documentation\n')
    })
  })
  context('--follow=--otherdb', () => {
    beforeEach(() => {
      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'}, config: {follow: '--otherdb', rollback: true, foo: true}, plan: {name: 'heroku-postgresql:standard-0'},
      })
        .reply(200, addon)
    })
    it('creates an addon with =-- args', () => {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow=--otherdb',
        '--foo',
      ])
    })
  })
  context('no config vars supplied by add-on provider', () => {
    beforeEach(() => {
      const noConfigAddon = {..._.clone(addon), config_vars: undefined}

      api.post('/apps/myapp/addons', {
        attachment: {name: 'mydb'}, config: {}, plan: {name: 'heroku-postgresql:standard-0'},
      })
        .reply(200, noConfigAddon)
    })
    it('creates an add-on without the config vars listed', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
      ])
      expect(stderr.output).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)\n')
      expect(stdout.output).to.equal('provision message\nCreated db3-swiftly-123\nUse heroku addons:docs heroku-db3 to view documentation\n')
    })
  })
})
