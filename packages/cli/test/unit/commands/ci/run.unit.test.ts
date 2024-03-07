import {expect, test} from '@oclif/test'
import * as fs from 'async-file'

import * as git from '../../../../src/lib/ci/git'
const got = require('got')

describe('ci:run', () => {
  test
    .command(['ci:run'])
    .catch(error => {
      expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    })
    .it('errors when not specifying a pipeline or an app')

  describe('when specifying a pipeline', () => {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}
    const ghRepository = {
      user: 'heroku-fake', repo: 'my-repo', ref: '668a5ce22eefc7b67c84c1cfe3a766f1958e0add', branch: 'my-test-branch',
    }
    const newTestRun = {
      commit_branch: ghRepository.branch,
      commit_message: 'latest commit',
      commit_sha: ghRepository.ref,
      id: 'b6512323-3a11-43ac-b4e4-9668b6a6b30c',
      number: 11,
      pipeline: {id: pipeline.id},
      status: 'succeeded',
    }

    const gitFake = {
      readCommit: () => ({branch: ghRepository.branch, ref: ghRepository.ref}),
      remoteFromGitConfig: () => Promise.resolve('heroku'),
      getBranch: () => Promise.resolve(ghRepository.branch),
      getRef: () => Promise.resolve(ghRepository.ref),
      getCommitTitle: () => Promise.resolve(`pushed to ${ghRepository.branch}`),
      githubRepository: () => Promise.resolve({user: ghRepository.user, repo: ghRepository.repo}),
      createArchive: () => Promise.resolve('new-archive.tgz'),
      spawn: () => Promise.resolve(),
      urlExists: () => Promise.resolve(),
      exec: (args: any) => {
        switch (args.join(' ')) {
        case 'remote':
          return Promise.resolve('heroku')
        default:
          return Promise.resolve()
        }
      },
    }

    const fsFake = {
      stat: () => Promise.resolve({size: 500}),
      createReadStream: () => ({pipe: () => {}}),
    }

    const gotFake = {
      stream: {put: () => {
        return {
          on: (eventName: string, callback: () => void) => {
            if (eventName === 'response') callback()
          },
        }
      }},
    }

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {id: pipeline.id},
          ])

        api.post('/test-runs')
          .reply(200, newTestRun)

        api.get(`/pipelines/${pipeline.id}/test-runs/${newTestRun.number}`)
          .reply(200, newTestRun)

        api.get(`/test-runs/${newTestRun.id}/test-nodes`)
          .times(2)
          .reply(200, [
            {
              commit_branch: newTestRun.commit_branch,
              commit_message: newTestRun.commit_message,
              commit_sha: newTestRun.commit_sha,
              id: newTestRun.id,
              number: newTestRun.number,
              pipeline: {id: pipeline.id},
              exit_code: 0,
              status: newTestRun.status,
              setup_stream_url: `https://test-setup-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
              output_stream_url: `https://test-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
            },
          ])
      })
      .nock('https://test-setup-output.heroku.com/streams', testOutputAPI => {
        testOutputAPI.get(`/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`)
          .reply(200, 'New Test setup output')
      })
      .nock('https://test-output.heroku.com/streams', testOutputAPI => {
        testOutputAPI.get(`/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`)
          .reply(200, 'New Test output')
      })
      .nock('https://kolkrabbi.heroku.com', kolkrabbiAPI => {
        kolkrabbiAPI.get(`/github/repos/${ghRepository.user}/${ghRepository.repo}/tarball/${ghRepository.ref}`)
          .reply(200, {
            archive_link: 'https://kolkrabbi.heroku.com/source/archive/gAAAAABb',
          })
        kolkrabbiAPI.get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, {
            ci: true,
            organization: {id: 'e037ed63-5781-48ee-b2b7-8c55c571b63e'},
            owner: {
              id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b',
              heroku: {
                user_id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b'},
              github: {user_id: 306015},
            },
            repository: {
              id: 138865824,
              name: 'raulb/atleti',
              type: 'github',
            },
          })
        kolkrabbiAPI.head('/source/archive/gAAAAABb')
          .reply(200)
      })
      .stub(git, 'readCommit', gitFake.readCommit)
      .stub(git, 'githubRepository', gitFake.githubRepository)
      .stub(git, 'createArchive', gitFake.createArchive)
      .command(['ci:run', `--pipeline=${pipeline.name}`])
      .it('it runs the test and displays the test output for the first node', ({stdout}) => {
        expect(stdout).to.equal('New Test setup outputNew Test output\n✓ #11 my-test-branch:668a5ce succeeded\n')
      })

    describe('when the commit is not in the remote repository', function () {
      test
        .stdout()
        .nock('https://api.heroku.com', api => {
          api.get(`/pipelines?eq[name]=${pipeline.name}`)
            .reply(200, [
              {id: pipeline.id},
            ])

          api.post('/test-runs')
            .reply(200, newTestRun)

          api.get(`/pipelines/${pipeline.id}/test-runs/${newTestRun.number}`)
            .reply(200, newTestRun)

          api.get(`/test-runs/${newTestRun.id}/test-nodes`)
            .times(2)
            .reply(200, [
              {
                commit_branch: newTestRun.commit_branch,
                commit_message: newTestRun.commit_message,
                commit_sha: newTestRun.commit_sha,
                id: newTestRun.id,
                number: newTestRun.number,
                pipeline: {id: pipeline.id},
                exit_code: 0,
                status: newTestRun.status,
                setup_stream_url: `https://test-setup-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
                output_stream_url: `https://test-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
              },
            ])

          api.post('/sources')
            .reply(200, {source_blob: {put_url: 'https://aws-puturl', get_url: 'https://aws-geturl'}})
        })
        .nock('https://test-setup-output.heroku.com/streams', testOutputAPI => {
          testOutputAPI.get(`/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`)
            .reply(200, 'New Test setup output')
        })
        .nock('https://test-output.heroku.com/streams', testOutputAPI => {
          testOutputAPI.get(`/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`)
            .reply(200, 'New Test output')
        })
        .nock('https://kolkrabbi.heroku.com', kolkrabbiAPI => {
          kolkrabbiAPI.get(`/github/repos/${ghRepository.user}/${ghRepository.repo}/tarball/${ghRepository.ref}`)
            .reply(404)
          kolkrabbiAPI.get(`/pipelines/${pipeline.id}/repository`)
            .reply(200, {
              ci: true,
              organization: {id: 'e037ed63-5781-48ee-b2b7-8c55c571b63e'},
              owner: {
                id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b',
                heroku: {
                  user_id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b'},
                github: {user_id: 306015},
              },
              repository: {
                id: 138865824,
                name: 'raulb/atleti',
                type: 'github',
              },
            })
        })
        .stub(git, 'readCommit', gitFake.readCommit)
        .stub(git, 'githubRepository', gitFake.githubRepository)
        .stub(git, 'createArchive', gitFake.createArchive)
        .stub(fs, 'stat', fsFake.stat)
        .stub(fs, 'createReadStream', fsFake.createReadStream)
        .stub(
          got,
          'stream',
          // disable below is due to incomplete type definition of `stub`
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore-next-line
          gotFake.stream,
        )
        .command(['ci:run', `--pipeline=${pipeline.name}`])
        .it('it runs the test and displays the test output for the first node', ({stdout}) => {
          expect(stdout).to.equal('New Test setup outputNew Test output\n✓ #11 my-test-branch:668a5ce succeeded\n')
        })
    })
  })
})
