'use strict'
/* globals describe beforeEach commands it */

const nock = require('nock')
const cli = require('heroku-cli-util')
const expect = require('chai').expect
const cmd = commands.find(c => c.topic === 'apps' && c.command === 'destroy')

describe('apps:destroy', function () {
  beforeEach(() => cli.mockConsole())

  it('deletes the app', async function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, { name: 'myapp' })
      .delete('/apps/myapp').reply(200)

    await cmd.run({ app: 'myapp', args: {}, flags: { confirm: 'myapp' } })

    expect(cli.stdout).to.equal('');
    expect(cli.stderr).to.equal('Destroying myapp (including all add-ons)... done\n');

    return api.done()
  })

  it('deletes the app via arg', async function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, { name: 'myapp' })
      .delete('/apps/myapp').reply(200)

    let context = { args: { app: 'myapp' }, flags: { confirm: 'myapp' } }

    await cmd.run(context)

    expect(cli.stdout).to.equal('');
    expect(cli.stderr).to.equal('Destroying myapp (including all add-ons)... done\n');
    api.done();

    return expect(context.app).to.equal('myapp')
  })
})
