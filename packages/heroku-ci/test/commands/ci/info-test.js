/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const cmd = require('../../../commands/ci/info')

describe('heroku ci:info', function () {
  let app, coupling, pipelineRepository

  beforeEach(function () {
    cli.mockConsole()
    app = '123-app'

    coupling = {
      pipeline: {
        id: '123-abc',
        name: 'test-pipeline'
      }
    }

    pipelineRepository = {
      ci: true,
      organization: {
        name: 'heroku-devex'
      },

      repository: {
        name: 'heroku/heroku'
      }
    }
  })

  it('displays pipeline and repo info', function () {
    const api = nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)

    const kolkrabbi = nock('https://kolkrabbi.herokuapp.com')
      .get(`/pipelines/${coupling.pipeline.id}/repository`)
      .reply(200, pipelineRepository)

    return cmd.run({ app }).then(() => {
      expect(cli.stdout).to.contain(coupling.pipeline.name)
      expect(cli.stdout).to.contain(pipelineRepository.repository.name)
      expect(cli.stdout).to.contain(pipelineRepository.organization.name)

      api.done()
      kolkrabbi.done()
    })
  })
})
