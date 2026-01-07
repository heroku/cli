import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('ci:config', function () {
  const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'my-pipeline'}
  const config = {
    KEY1: 'VALUE1',
    OTHER: 'test',
    RAILS_ENV: 'test',
  }

  afterEach(() => nock.cleanAll())

  it('errors when not specifying a pipeline or an app', async () => {
    const {error} = await runCommand(['ci:config'])
    expect(error?.message).to.contain('Exactly one of the following must be provided: --app, --pipeline')
  })

  it('displays config when a pipeline is specified', async () => {
    nock('https://api.heroku.com')
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [
        {
          id: pipeline.id,
          name: pipeline.name,
        },
      ])
      .get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, config)

    const {stdout} = await runCommand(['ci:config', `--pipeline=${pipeline.name}`])

    expect(stdout).to.include('=== my-pipeline test config vars')
    expect(stdout).to.include('KEY1:      VALUE1\nOTHER:     test\nRAILS_ENV: test\n')
  })

  it('displays config formatted as JSON', async () => {
    nock('https://api.heroku.com')
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [
        {
          id: pipeline.id,
          name: pipeline.name,
        },
      ])
      .get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, config)

    const {stdout} = await runCommand(['ci:config', `--pipeline=${pipeline.name}`, '--json'])

    expect(stdout).to.equal('{\n  "KEY1": "VALUE1",\n  "OTHER": "test",\n  "RAILS_ENV": "test"\n}\n')
  })

  it('displays config formatted for shell', async () => {
    nock('https://api.heroku.com')
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [
        {
          id: pipeline.id,
          name: pipeline.name,
        },
      ])
      .get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, config)

    const {stdout} = await runCommand(['ci:config', `--pipeline=${pipeline.name}`, '--shell'])

    expect(stdout).to.equal('KEY1=VALUE1\nOTHER=test\nRAILS_ENV=test\n')
  })
})
