'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/pipelines/destroy')

describe('pipelines:destroy', function () {
  beforeEach(() => cli.mockConsole())

  it('displays the right messages', function () {
    const pipeline = {name: 'example', id: '0123'}

    nock('https://api.heroku.com')
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [pipeline])

    nock('https://api.heroku.com')
      .delete(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)

    return cmd.run({args: { pipeline: pipeline.name }})
      .then(() => cli.stderr.should.contain(`Destroying ${pipeline.name} pipeline... done`))
  })
})
