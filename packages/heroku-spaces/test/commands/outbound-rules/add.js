'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let chai = require('chai')
let cmd = require('../../../commands/outbound-rules/add')
let cli = require('heroku-cli-util')

describe('outbound-rules:add', function () {
  beforeEach(() => cli.mockConsole())

  it('adds a rule entry to the outbound rules', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .reply(200, {rules: []})
    return cmd.run({flags: {space: 'my-space', dest: '128.0.1.1/20', port: '80', protocol: 'tcp'}})
      .then(() => api.done())
  })

  it('support ranges', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 80, to_port: 100, protocol: 'tcp'}
        ]
      })
      .reply(200, {rules: []})
    return cmd.run({flags: {space: 'my-space', dest: '128.0.1.1/20', port: '80-100', protocol: 'tcp'}})
      .then(() => api.done())
  })

  it('handles strange port range case of 80-', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .reply(200, {rules: []})
    return cmd.run({flags: {space: 'my-space', dest: '128.0.1.1/20', port: '80-', protocol: 'tcp'}})
      .then(() => api.done())
  })

  it('handles strange port range case of 80-100-200', function () {
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
    return chai.assert.isRejected(cmd.run({flags: {space: 'my-space', dest: '128.0.1.1/20', port: '80-100-200', protocol: 'tcp'}}), /^Error: Specified --port range seems incorrect.$/)
  })

  it('supports -1 as port', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 0, to_port: 65535, protocol: 'tcp'}
        ]
      })
      .reply(200, {rules: []})
    return cmd.run({flags: {space: 'my-space', dest: '128.0.1.1/20', port: '-1', protocol: 'tcp'}})
      .then(() => api.done())
  })

  it('supports any as port', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 0, to_port: 65535, protocol: 'tcp'}
        ]
      })
      .reply(200, {rules: []})
    return cmd.run({flags: {space: 'my-space', dest: '128.0.1.1/20', port: 'any', protocol: 'tcp'}})
      .then(() => api.done())
  })

  it('correct supports any as port for ICMP', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'}
        ]
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'dickeyxxx',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 0, to_port: 255, protocol: 'icmp'}
        ]
      })
      .reply(200, {rules: []})
    return cmd.run({flags: {space: 'my-space', dest: '128.0.1.1/20', port: 'any', protocol: 'icmp'}})
      .then(() => api.done())
  })
})
