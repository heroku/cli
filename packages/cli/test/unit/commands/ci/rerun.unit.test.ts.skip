import {test, expect} from '@oclif/test'
import {promises as fs} from 'fs'
import {PassThrough} from 'node:stream'

import * as git from '../../../../src/lib/ci/git.js'
import got from 'got'

describe('ci:rerun', function () {
  test
    .command(['ci:rerun'])
    .catch(error => {
      expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    })
    .it('errors when not specifying a pipeline or an app')

  describe('when specifying a pipeline', function () {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}
    const ghRepository = {
      user: 'heroku-fake', repo: 'my-repo', ref: '668a5ce22eefc7b67c84c1cfe3a766f1958e0add', branch: 'my-test-branch',
    }
    const oldTestRun = {
      commit_branch: ghRepository.branch,
      commit_message: 'earlier commit',
      commit_sha: '2F3CAFFD6AEEC967A7D71EB7ABEC0993D036430691E668A8710248DF4541111E',
      id: 'd76b690b-a4ce-4a7b-83ca-c30792d4f3be',
      number: 10,
      pipeline: {id: pipeline.id},
      status: 'failed',
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
      exec(args: any) {
        switch (args.join(' ')) {
        case 'remote': {
          return Promise.resolve('heroku')
        }

        default: {
          return Promise.resolve()
        }
        }
      },
    }

    const fsFake = {
      stat: () => Promise.resolve({size: 500}),
      createReadStream: () => ({
        pipe(dest: any) {
          // Simulate a readable stream that properly pipes to destination
          if (dest && typeof dest.once === 'function') {
            dest.once('response', () => {})
          }

          return dest
        },
        once() {},
        on() {},
      }),
    }

    const gotFake = {
      stream: {put() {
        const stream = new PassThrough()
        // Simulate HTTP response by emitting 'response' event
        setImmediate(() => {
          stream.emit('response')
        })
        return stream
      }},
    }

    describe('when not specifying a run #', function () {
      test
        .stdout()
        .nock('https://api.heroku.com', api => {
          api.get(`/pipelines?eq[name]=${pipeline.name}`)
            .reply(200, [
              {id: pipeline.id},
            ])

          api.get(`/pipelines/${pipeline.id}/test-runs`)
            .reply(200, [oldTestRun])

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
        .stub(git, 'githubRepository', gitFake.githubRepository)
        .stub(git, 'createArchive', gitFake.createArchive)
        .stub(fs, 'stat', fsFake.stat)
        .stub(fs, 'createReadStream', () => {
          const stream = new PassThrough()
          stream.end('fake archive data')
          return stream
        })
        .stub(
          got,
          'stream',
          // disable below is due to incomplete type definition of `stub`
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore-next-line
          gotFake.stream,
        )
        .command(['ci:rerun', `--pipeline=${pipeline.name}`])
        .it('it runs the test and displays the test output for the first node', ({stdout}) => {
          expect(stdout).to.equal('Rerunning test run #10...\nNew Test setup outputNew Test output\n✓ #11 my-test-branch:668a5ce succeeded\n')
        })
    })

    describe('when specifying a run #', function () {
      test
        .stdout()
        .nock('https://api.heroku.com', api => {
          api.get(`/pipelines?eq[name]=${pipeline.name}`)
            .reply(200, [
              {id: pipeline.id},
            ])

          api.get(`/pipelines/${pipeline.id}/test-runs/${oldTestRun.number}`)
            .reply(200, oldTestRun)

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
        .stub(git, 'githubRepository', gitFake.githubRepository)
        .stub(git, 'createArchive', gitFake.createArchive)
        .stub(fs, 'stat', fsFake.stat)
        .stub(fs, 'createReadStream', () => {
          const stream = new PassThrough()
          stream.end('fake archive data')
          return stream
        })
        .stub(
          got,
          'stream',
          // disable below is due to incomplete type definition of `stub`
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore-next-line
          gotFake.stream,
        )
        .command(['ci:rerun', `${oldTestRun.number}`, `--pipeline=${pipeline.name}`])
        .it('it runs the test and displays the test output for the first node', ({stdout}) => {
          expect(stdout).to.equal('Rerunning test run #10...\nNew Test setup outputNew Test output\n✓ #11 my-test-branch:668a5ce succeeded\n')
        })
    })
  })
})
