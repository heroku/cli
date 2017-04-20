'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/pipelines')[0]

describe('pipelines', () => {
  beforeEach(() => cli.mockConsole())

  it('displays the right messages', () => {
    const pipelines = [
      { id: '0123', name: 'Betelgeuse' },
      { id: '9876', name: 'Sirius' }
    ]

    let api = nock('https://api.heroku.com')
      .get(`/pipelines`)
      .reply(200, pipelines)

    return cmd.run({flags: {}})
    .then(() => {
      const output = cli.stdout

      output.should.contain('My Pipelines')
      output.should.contain('Betelgeuse')
      output.should.contain('Sirius')
    })
    .then(() => api.done())
  })

  it('outputs json format', () => {
    const pipelines = [
      { id: '0123', name: 'Betelgeuse' },
      { id: '9876', name: 'Sirius' }
    ]

    let api = nock('https://api.heroku.com')
      .get(`/pipelines`)
      .reply(200, pipelines)

    return cmd.run({flags: {json: true}})
    .then(() => JSON.parse(cli.stdout)[0].name.should.eq('Betelgeuse'))
    .then(() => api.done())
  })
})
