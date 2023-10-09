import {expect, test} from '@oclif/test'

describe('ci:config', () => {
  const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'my-pipeline'}
  const config = {
    KEY1: 'VALUE1',
    OTHER: 'test',
    RAILS_ENV: 'test',
  }

  test
    .command(['ci:config'])
    .catch(error => {
      expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    })
    .it('errors when not specifying a pipeline or an app')

  test
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [
          {
            id: pipeline.id,
            name: pipeline.name,
          },
        ])

      api.get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
        .reply(200, config)
    })
    .command(['ci:config', `--pipeline=${pipeline.name}`])
    .it('displays config when a pipeline is specified', ({stdout}) => {
      expect(stdout).to.include('=== my-pipeline test config vars')
      expect(stdout).to.include('KEY1:      VALUE1\nOTHER:     test\nRAILS_ENV: test\n')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [
          {
            id: pipeline.id,
            name: pipeline.name,
          },
        ])

      api.get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
        .reply(200, config)
    })
    .command(['ci:config', `--pipeline=${pipeline.name}`, '--json'])
    .it('displays config formatted as JSON', ({stdout}) => {
      expect(stdout).to.equal('{\n  "KEY1": "VALUE1",\n  "OTHER": "test",\n  "RAILS_ENV": "test"\n}\n')
    })

  test
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [
          {
            id: pipeline.id,
            name: pipeline.name,
          },
        ])

      api.get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
        .reply(200, config)
    })
    .command(['ci:config', `--pipeline=${pipeline.name}`, '--shell'])
    .it('displays config formatted for shell', ({stdout}) => {
      expect(stdout).to.equal('KEY1=VALUE1\nOTHER=test\nRAILS_ENV=test\n')
    })
})
