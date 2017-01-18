'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/pipelines/rename')

describe('pipelines:rename', function () {
  beforeEach(() => cli.mockConsole())

  it('displays the right messages', function () {
    const oldName = 'polaris'
    const newName = 'vega'
    const id = '12345'

    nock('https://api.heroku.com')
      .get(`/pipelines?eq[name]=${oldName}`)
      .reply(200, [{id, name: oldName}])

    nock('https://api.heroku.com')
      .patch(`/pipelines/${id}`)
      .reply(200, {id, name: newName})

    return cmd.run({args: { pipeline: oldName, name: newName }}).then(() => {
      const output = cli.stderr
      output.should.contain(`Renaming ${oldName} pipeline to ${newName}... done`)
    })
  })
})
