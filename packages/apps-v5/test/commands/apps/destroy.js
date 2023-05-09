'use strict'
/* globals beforeEach commands */

const nock = require('nock')
const cli = require('heroku-cli-util')
const expect = require('chai').expect
const cmd = commands.find(c => c.topic === 'apps' && c.command === 'destroy')

describe('apps:destroy', function () {
  beforeEach(() => cli.mockConsole())

  it('deletes the app', function () {
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp').reply(200, {name: 'myapp'})
    .delete('/apps/myapp').reply(200)

    return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}})
    .then(() => expect(cli.stdout).to.equal(''))
    .then(() => expect(cli.stderr).to.equal('Destroying myapp (including all add-ons)... done\n'))
    .then(() => api.done())
  })

  it('deletes the app via arg', function () {
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp').reply(200, {name: 'myapp'})
    .delete('/apps/myapp').reply(200)

    let context = {args: {app: 'myapp'}, flags: {confirm: 'myapp'}}
    return cmd.run(context)
    .then(() => expect(cli.stdout).to.equal(''))
    .then(() => expect(cli.stderr).to.equal('Destroying myapp (including all add-ons)... done\n'))
    .then(() => api.done())
    .then(() => expect(context.app).to.equal('myapp'))
  })
})
