'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let chai = require('chai')
let cmd = require('../../../commands/outbound-rules/add')
let cli = require('heroku-cli-util')

describe('outbound-rules:add', function () {
  beforeEach(() => cli.mockConsole())

  it('adds a rule entry to the outbound rules', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' },
          { target: '128.0.1.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
      .reply(200, { rules: [] })
    await cmd.run({ flags: { space: 'my-space', dest: '128.0.1.1/20', port: '80', protocol: 'tcp' } })
    return api.done()
  })

  it('support ranges', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' },
          { target: '128.0.1.1/20', from_port: 80, to_port: 100, protocol: 'tcp' }
        ]
      })
      .reply(200, { rules: [] })
    await cmd.run({ flags: { space: 'my-space', dest: '128.0.1.1/20', port: '80-100', protocol: 'tcp' } })
    return api.done()
  })

  it('handles strange port range case of 80-', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' },
          { target: '128.0.1.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
      .reply(200, { rules: [] })
    await cmd.run({ flags: { space: 'my-space', dest: '128.0.1.1/20', port: '80-', protocol: 'tcp' } })
    return api.done()
  })

  it('handles strange port range case of 80-100-200', function () {
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
    return chai.assert.isRejected(cmd.run({ flags: { space: 'my-space', dest: '128.0.1.1/20', port: '80-100-200', protocol: 'tcp' } }), /^Specified --port range seems incorrect.$/)
  })

  it('supports -1 as port', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' },
          { target: '128.0.1.1/20', from_port: 0, to_port: 65535, protocol: 'tcp' }
        ]
      })
      .reply(200, { rules: [] })
    await cmd.run({ flags: { space: 'my-space', dest: '128.0.1.1/20', port: '-1', protocol: 'tcp' } })
    return api.done()
  })

  it('supports any as port', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' },
          { target: '128.0.1.1/20', from_port: 0, to_port: 65535, protocol: 'tcp' }
        ]
      })
      .reply(200, { rules: [] })
    await cmd.run({ flags: { space: 'my-space', dest: '128.0.1.1/20', port: 'any', protocol: 'tcp' } })
    return api.done()
  })

  it('correct supports any as port for ICMP', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' }
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          { target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp' },
          { target: '128.0.1.1/20', from_port: 0, to_port: 255, protocol: 'icmp' }
        ]
      })
      .reply(200, { rules: [] })
    await cmd.run({ flags: { space: 'my-space', dest: '128.0.1.1/20', port: 'any', protocol: 'icmp' } })
    return api.done()
  })
})
