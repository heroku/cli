'use strict'
/* globals describe beforeEach it afterEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'ps' && c.command === 'scale')
const { expect } = require('chai')

describe('ps:scale', () => {
  beforeEach(() => cli.mockConsole())

  afterEach(() => nock.cleanAll())

  it('shows formation with no args', async () => {
    let api = nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [{ type: 'web', quantity: 1, size: 'Free' }, { type: 'worker', quantity: 2, size: 'Free' }])
      .get('/apps/myapp')
      .reply(200, { name: 'myapp' })

    await cmd.run({ app: 'myapp', args: [] })

    expect(cli.stdout).to.equal('web=1:Free worker=2:Free\n');
    expect(cli.stderr, 'to be empty');

    return api.done()
  })

  it('shows formation with shield dynos for apps in a shielded private space', async () => {
    let api = nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [{ type: 'web', quantity: 1, size: 'Private-L' }, { type: 'worker', quantity: 2, size: 'Private-M' }])
      .get('/apps/myapp')
      .reply(200, { name: 'myapp', space: { shield: true } })

    await cmd.run({ app: 'myapp', args: [] })

    expect(cli.stdout).to.equal('web=1:Shield-L worker=2:Shield-M\n');
    expect(cli.stderr, 'to be empty');

    return api.done()
  })

  it('errors with no process types', async () => {
    let api = nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp')
      .reply(200, { name: 'myapp' })

    await expect(cmd.run({ app: 'myapp', args: [] }))
      .to.be.rejectedWith(Error, /^No process types on myapp./)

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr, 'to be empty');

    return api.done()
  })

  it('scales web=1 worker=2', async () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/formation', { updates: [{ type: 'web', quantity: '1' }, { type: 'worker', quantity: '2' }] })
      .reply(200, [{ type: 'web', quantity: 1, size: 'Free' }, { type: 'worker', quantity: 2, size: 'Free' }])
      .get('/apps/myapp')
      .reply(200, { name: 'myapp' })

    await cmd.run({ app: 'myapp', args: ['web=1', 'worker=2'] })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.equal('Scaling dynos... done, now running web at 1:Free, worker at 2:Free\n');

    return api.done()
  })

  it('scales up a shield dyno if the app is in a shielded private space', async () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/formation', { updates: [{ type: 'web', quantity: '1', size: 'Private-L' }] })
      .reply(200, [{ type: 'web', quantity: 1, size: 'Private-L' }])
      .get('/apps/myapp')
      .reply(200, { name: 'myapp', space: { shield: true } })

    await cmd.run({ app: 'myapp', args: ['web=1:Shield-L'] })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.equal('Scaling dynos... done, now running web at 1:Shield-L\n');

    return api.done()
  })

  it('scales web-1', async () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/formation', { updates: [{ type: 'web', quantity: '+1' }] })
      .reply(200, [{ type: 'web', quantity: 2, size: 'Free' }])
      .get('/apps/myapp')
      .reply(200, { name: 'myapp' })

    await cmd.run({ app: 'myapp', args: ['web+1'] })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.equal('Scaling dynos... done, now running web at 2:Free\n');

    return api.done()
  })
})
