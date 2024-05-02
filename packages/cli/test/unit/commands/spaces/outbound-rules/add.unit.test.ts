import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/outbound-rules/add'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')

describe('outbound-rules:add', function () {
  it('adds a rule entry to the outbound rules', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .reply(200, {rules: []})

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--dest',
      '128.0.1.1/20',
      '--port',
      '80',
      '--protocol',
      'tcp',
    ])
    expect(stripAnsi(stderr.output)).to.include('Adding rule to the Outbound Rules of my-space... done')
    expect(stripAnsi(stderr.output)).to.include('Warning: Modifying the Outbound Rules may break Add-ons for Apps')
  })

  it('support ranges', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 80, to_port: 100, protocol: 'tcp'},
        ],
      })
      .reply(200, {rules: []})
    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--dest',
      '128.0.1.1/20',
      '--port',
      '80-100',
      '--protocol',
      'tcp',
    ])
    expect(stripAnsi(stderr.output)).to.include('Adding rule to the Outbound Rules of my-space... done')
    expect(stripAnsi(stderr.output)).to.include('Warning: Modifying the Outbound Rules may break Add-ons for Apps')
  })

  it('handles strange port range case of 80-', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .reply(200, {rules: []})
    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--dest',
      '128.0.1.1/20',
      '--port',
      '80-',
      '--protocol',
      'tcp',
    ])
    expect(stripAnsi(stderr.output)).to.include('Adding rule to the Outbound Rules of my-space... done')
    expect(stripAnsi(stderr.output)).to.include('Warning: Modifying the Outbound Rules may break Add-ons for Apps')
  })

  it('handles strange port range case of 80-100-200', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--dest',
      '128.0.1.1/20',
      '--port',
      '80-100-200',
      '--protocol',
      'tcp',
    ]).catch((error: any) => {
      expect(error.message).to.contain('Specified --port range seems incorrect.')
    })
  })

  it('supports -1 as port', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 0, to_port: 65535, protocol: 'tcp'},
        ],
      })
      .reply(200, {rules: []})
    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--dest',
      '128.0.1.1/20',
      '--port',
      '-1',
      '--protocol',
      'tcp',
    ])
    expect(stripAnsi(stderr.output)).to.include('Adding rule to the Outbound Rules of my-space... done')
    expect(stripAnsi(stderr.output)).to.include('Warning: Modifying the Outbound Rules may break Add-ons for Apps')
  })

  it('supports any as port', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 0, to_port: 65535, protocol: 'tcp'},
        ],
      })
      .reply(200, {rules: []})
    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--dest',
      '128.0.1.1/20',
      '--port',
      'any',
      '--protocol',
      'tcp',
    ])
    expect(stripAnsi(stderr.output)).to.include('Adding rule to the Outbound Rules of my-space... done')
    expect(stripAnsi(stderr.output)).to.include('Warning: Modifying the Outbound Rules may break Add-ons for Apps')
  })

  it('correct supports any as port for ICMP', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/outbound-ruleset')
      .reply(200, {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
        ],
      })
      .put('/spaces/my-space/outbound-ruleset', {
        created_by: 'gandalf',
        rules: [
          {target: '128.0.0.1/20', from_port: 80, to_port: 80, protocol: 'tcp'},
          {target: '128.0.1.1/20', from_port: 0, to_port: 255, protocol: 'icmp'},
        ],
      })
      .reply(200, {rules: []})
    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--dest',
      '128.0.1.1/20',
      '--port',
      'any',
      '--protocol',
      'icmp',
    ])
    expect(stripAnsi(stderr.output)).to.include('Adding rule to the Outbound Rules of my-space... done')
    expect(stripAnsi(stderr.output)).to.include('Warning: Modifying the Outbound Rules may break Add-ons for Apps')
  })
})
