'use strict'

let cli = require('heroku-cli-util')
let nock = require('nock')
let cmd = require('../../../commands/pipelines/create')

describe('pipelines:create', function () {
  let heroku, coupling, pipeline

  beforeEach(function () {
    cli.mockConsole()
    heroku = nock('https://api.heroku.com')
    coupling = { id: '0123', stage: 'production' }

    heroku.post('/pipeline-couplings')
    .reply(201, coupling)
  })

  context('when not specifying ownership', function () {
    beforeEach(function () {
      pipeline = {name: 'example', id: '0123', owner: { id: '1234-567', type: 'user' }}

      heroku
      .get('/users/~')
      .reply(200, { id: '1234-567' })
      .post('/pipelines')
      .reply(201, pipeline)
    })

    it('displays the pipeline name and app stage', function () {
      return cmd.run({app: 'example', args: {name: 'example'}, flags: {stage: 'production'}})
      .then(function () {
        cli.stderr.should.contain('Creating example pipeline... done')
        cli.stderr.should.contain('Adding example to example pipeline as production... done')
        heroku.done()
      })
    })
  })

  context('when specifying a team as owner', function () {
    beforeEach(function () {
      pipeline = {name: 'example', id: '0123', owner: { id: '89-0123-456', type: 'team' }}

      heroku
      .get('/teams/my-team')
      .reply(200, { id: '89-0123-456' })
      .post('/pipelines')
      .reply(201, pipeline)
    })

    it('displays the pipeline name and app stage', function () {
      return cmd.run({app: 'example', args: {name: 'example'}, flags: {stage: 'production', team: 'my-team'}})
      .then(function () {
        cli.stderr.should.contain('Creating example pipeline... done')
        cli.stderr.should.contain('Adding example to example pipeline as production... done')
        heroku.done()
      })
    })
  })
})
