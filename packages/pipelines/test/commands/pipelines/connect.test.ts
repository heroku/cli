import {expect, test} from '@oclif/test'
import * as nock from 'nock'

describe.only('pipelines:connect', () => {
  nock.disableNetConnect()
  describe('when the user is not linked to GitHub', () => {
    test
      .stderr()
      .stdout()
      .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
        kolkrabbi.get('/account/github/token').reply(401, {})
      })
      .command(['pipelines:connect', '--repo=my-repo'])
      .catch('Account not connected to GitHub.')
      .it('displays an error')
  })

  describe('with an account connected to Github', () => {
    test
      .nock('https://kolkrabbi.heroku.com', kolkrabbi => {
        const kolkrabbiAccount = {
          github: {
            token: '123-abc'
          }
        }
        const pipeline = {
          id: 123,
          name: 'my-pipeline'
        }
        kolkrabbi.get('/account/github/token').reply(200, kolkrabbiAccount)
        return kolkrabbi.post(`/pipelines/${pipeline.id}/repository`).reply(201, {})
      })
      .nock('https://api.github.com', github => {
        const repo = {
          id: 1235,
          default_branch: 'master',
          name: 'my-org/my-repo'
        }
        github.get(`/repos/${repo.name}`).reply(200, {repo})
      })
      .nock('https://api.heroku.com', api => {
        const pipeline = {
          id: 123,
          name: 'my-pipeline'
        }

        return api.get(`/pipelines/${pipeline.name}`)
          .reply(200, {
            id: pipeline.id,
            name: pipeline.name
          })
      })
      // .stderr()
      // .stdout()
      .command(['pipelines:connect', 'my-pipeline', '--repo=my-org/my-repo'])
      .it('shows success', ctx => {
        console.log('hello')
        // expect(ctx.stderr).to.include('Linking to repo...')
        // // expect(ctx.stdout).to.equal('')
      })
  })
})
