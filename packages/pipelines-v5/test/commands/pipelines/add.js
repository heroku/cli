'use strict'

let cli = require('heroku-cli-util')
let nock = require('nock')
let cmd = require('../../../commands/pipelines/add')

describe('pipelines:add', function () {
  beforeEach(function () {
    cli.mockConsole()
  })

  it('displays the right messages', function () {
    let pipeline = {name: 'example', id: '0123'}
    let pipelines = [pipeline]
    let coupling = { id: '0123', stage: 'production' }

    nock('https://api.heroku.com')
      .get('/pipelines')
      .query(true)
      .reply(200, pipelines)

    nock('https://api.heroku.com')
      .post('/pipeline-couplings')
      .reply(201, coupling)

    return cmd.run({
      app: 'example',
      args: { pipeline: 'example' },
      flags: { stage: 'production' }
    }).then(function () {
      cli.stderr.should.contain('Adding example to example pipeline as production... done')
    })
  })
})
