'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/pipelines/update')

describe('pipelines:update', () => {
  beforeEach(() => cli.mockConsole())

  it('displays the right messages', () => {
    const app = 'example'
    const id = '0123'
    const stage = 'production'

    const coupling = { id, stage }

    nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)

    nock('https://api.heroku.com')
      .patch(`/pipeline-couplings/${id}`)
      .reply(200, coupling)

    return cmd.run({ app, flags: { stage } })
      .then(() => cli.stderr.should.contain(`Changing ${app} to ${stage}... done`))
  })
})
