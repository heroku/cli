import Nock from '@fancy-test/nock'
import * as Test from '@oclif/test'
import {mock} from 'sinon'

const test = Test.test
.register('nock', Nock)
const expect = Test.expect

describe('ci:run', () => {
  const testRunNumber = 10
  const testRun = {id: 'f53d34b4-c3a9-4608-a186-17257cf71d62', number: 10}

  test
  .command(['ci:run'])
  .catch(e => {
    expect(e.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
  })
  .it('errors when not specifying a pipeline or an app')

  describe('when specifying a pipeline', () => {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}
    const ghRepository = {
      user: 'heroku', repo: 'cli', ref: '668a5ce22eefc7b67c84c1cfe3a766f1958e0add'
    }

    const git = {
      remoteFromGitConfig: () => Promise.resolve('heroku'),
      getBranch: () => Promise.resolve('master'),
      getRef: () => Promise.resolve(ghRepository.ref),
      getCommitTitle: () => Promise.resolve('pushed to master'),
      githubRepository: () => Promise.resolve({user: ghRepository.user, repo: ghRepository.repo}),
      createArchive: () => Promise.resolve(),
      spawn: () => Promise.resolve(),
      urlExists: () => Promise.resolve(),
      exec: (args: any) => {
        switch (args.join(' ')) {
          case 'remote':
            return Promise.resolve('heroku')
          default:
            return Promise.resolve()
        }
      }
    }

    mock(git).expects('exec').resolves()

    test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [
        {id: pipeline.id}
      ])
      api.get(`/pipelines/${pipeline.id}/test-runs/${testRunNumber}`)
      .reply(200,
        {
          commit_branch: 'master',
          commit_message: 'Merge pull request #5848 from ',
          commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
          id: testRun.id,
          number: testRun.number,
          pipeline: {id: pipeline.id},
          status: 'succeeded'
        }
      )
      api.get(`/test-runs/${testRun.id}/test-nodes`)
      .reply(200, [
        {
          commit_branch: 'master',
          commit_message: 'Merge pull request #5848 from heroku/cli',
          commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
          id: testRun.id,
          number: testRun.number,
          pipeline: {id: pipeline.id},
          exit_code: 0,
          status: 'succeeded',
          setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.substring(0, 3)}/test-runs/${testRun.id}`,
          output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.substring(0, 3)}/test-runs/${testRun.id}`
        }
      ])
    })
    .nock('https://test-setup-output.heroku.com/streams', testOutputAPI => {
      testOutputAPI.get(`/${testRun.id.substring(0, 3)}/test-runs/${testRun.id}`)
      .reply(200, 'Test setup output')
    })
    .nock('https://test-output.heroku.com/streams', testOutputAPI => {
      testOutputAPI.get(`/${testRun.id.substring(0, 3)}/test-runs/${testRun.id}`)
      .reply(200, 'Test output')
    })
    .nock('https://kolkrabbi.heroku.com', kolkrabbiAPI => {
      kolkrabbiAPI.get(`/github/repos/${ghRepository.user}/${ghRepository.repo}/tarball/${ghRepository.ref}`).
      reply(200, {
        archive_link: 'https://kolkrabbi.heroku.com/source/archive/gAAAAABb'
      })
      kolkrabbiAPI.get(`/pipelines/${pipeline.id}/repository`)
      .reply(200, {
        ci: true,
        organization: {id: 'e037ed63-5781-48ee-b2b7-8c55c571b63e'},
        owner: {
          id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b',
          heroku: {
            user_id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b' },
            github: {user_id: 306015}
          },
          repository: {
            id: 138865824,
            name: 'raulb/atleti',
            type: 'github'
          }
      })
    })
    .command(['ci:run', `--pipeline=${pipeline.name}`])
    .it('and a pipeline without parallel test runs it runs the test', ({stdout, stderr}) => {
      expect(stdout).to.equal('Test setup outputTest output\n✓ #10 master:b9e982a succeeded\n')
      expect(stderr).to.equal('Tell me what happened')
    })
  })
})
