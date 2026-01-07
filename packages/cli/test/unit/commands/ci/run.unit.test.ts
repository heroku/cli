import {expect} from 'chai'
import {got} from 'got'
import nock from 'nock'
import {PassThrough} from 'node:stream'
import sinon from 'sinon'
import {stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/ci/run.js'
import {fileService, gitService} from '../../../../src/lib/ci/source.js'
import customRunCommand from '../../../helpers/runCommand.js'

describe('ci:run', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('errors when not specifying a pipeline or an app', async function () {
    try {
      await customRunCommand(Cmd, [])
    } catch (error: any) {
      expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    }
  })

  describe('when specifying a pipeline', function () {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}
    const ghRepository = {
      branch: 'my-test-branch',
      ref: '668a5ce22eefc7b67c84c1cfe3a766f1958e0add',
      repo: 'my-repo',
      user: 'heroku-fake',
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

    let sandbox: ReturnType<typeof sinon.createSandbox>

    beforeEach(function () {
      sandbox = sinon.createSandbox()

      // Stub gitService methods
      sandbox.stub(gitService, 'readCommit').resolves({branch: ghRepository.branch, ref: ghRepository.ref, message: `pushed to ${ghRepository.branch}`})
      sandbox.stub(gitService, 'githubRepository').resolves({user: ghRepository.user, repo: ghRepository.repo} as any)
      sandbox.stub(gitService, 'createArchive').resolves('new-archive.tgz')

      // Stub fileService methods
      sandbox.stub(fileService, 'stat').resolves({size: 500} as any)
      sandbox.stub(fileService, 'createReadStream').returns((() => {
        const stream = new PassThrough()
        stream.end('fake archive data')
        return stream
      })() as any)

      // Stub got.stream
      sandbox.stub(got, 'stream').value({
        put() {
          const stream = new PassThrough()
          setImmediate(() => {
            stream.emit('response')
          })
          return stream
        },
      })
    })

    afterEach(function () {
      sandbox.restore()
    })

    it('it runs the test and displays the test output for the first node', async function () {
      nock('https://api.heroku.com')
        .get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [
          {id: pipeline.id},
        ])
        .post('/test-runs')
        .reply(200, newTestRun)
        .get(`/pipelines/${pipeline.id}/test-runs/${newTestRun.number}`)
        .reply(200, newTestRun)
        .get(`/test-runs/${newTestRun.id}/test-nodes`)
        .times(2)
        .reply(200, [
          {
            commit_branch: newTestRun.commit_branch,
            commit_message: newTestRun.commit_message,
            commit_sha: newTestRun.commit_sha,
            exit_code: 0,
            id: newTestRun.id,
            number: newTestRun.number,
            output_stream_url: `https://test-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
            pipeline: {id: pipeline.id},
            setup_stream_url: `https://test-setup-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
            status: newTestRun.status,
          },
        ])
        .post('/sources')
        .reply(200, {source_blob: {get_url: 'https://aws-geturl', put_url: 'https://aws-puturl'}})

      nock('https://test-setup-output.heroku.com/streams')
        .get(`/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`)
        .reply(200, 'New Test setup output')

      nock('https://test-output.heroku.com/streams')
        .get(`/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`)
        .reply(200, 'New Test output')

      nock('https://kolkrabbi.heroku.com')
        .get(`/pipelines/${pipeline.id}/repository`)
        .reply(200, {
          ci: true,
          organization: {id: 'e037ed63-5781-48ee-b2b7-8c55c571b63e'},
          owner: {
            github: {user_id: 306015},
            heroku: {
              user_id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b'},
            id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b',
          },
          repository: {
            id: 138865824,
            name: 'raulb/atleti',
            type: 'github',
          },
        })

      await customRunCommand(Cmd, [`--pipeline=${pipeline.name}`])

      expect(stdout.output).to.equal('New Test setup outputNew Test output\n✓ #11 my-test-branch:668a5ce succeeded\n')
    })

    describe('when the commit is not in the remote repository', function () {
      it('it runs the test and displays the test output for the first node', async function () {
        nock('https://api.heroku.com')
          .get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {id: pipeline.id},
          ])
          .post('/test-runs')
          .reply(200, newTestRun)
          .get(`/pipelines/${pipeline.id}/test-runs/${newTestRun.number}`)
          .reply(200, newTestRun)
          .get(`/test-runs/${newTestRun.id}/test-nodes`)
          .times(2)
          .reply(200, [
            {
              commit_branch: newTestRun.commit_branch,
              commit_message: newTestRun.commit_message,
              commit_sha: newTestRun.commit_sha,
              exit_code: 0,
              id: newTestRun.id,
              number: newTestRun.number,
              output_stream_url: `https://test-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
              pipeline: {id: pipeline.id},
              setup_stream_url: `https://test-setup-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
              status: newTestRun.status,
            },
          ])
          .post('/sources')
          .reply(200, {source_blob: {put_url: 'https://aws-puturl', get_url: 'https://aws-geturl'}})

        nock('https://test-setup-output.heroku.com/streams')
          .get(`/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`)
          .reply(200, 'New Test setup output')

        nock('https://test-output.heroku.com/streams')
          .get(`/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`)
          .reply(200, 'New Test output')

        nock('https://kolkrabbi.heroku.com')
          .get(`/pipelines/${pipeline.id}/repository`)
          .reply(200, {
            ci: true,
            organization: {id: 'e037ed63-5781-48ee-b2b7-8c55c571b63e'},
            owner: {
              github: {user_id: 306015},
              heroku: {user_id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b'},
              id: '463147bf-d572-41cf-bbf4-11ebc1c0bc3b',
            },
            repository: {
              id: 138865824,
              name: 'raulb/atleti',
              type: 'github',
            },
          })

        await customRunCommand(Cmd, [`--pipeline=${pipeline.name}`])

        expect(stdout.output).to.equal('New Test setup outputNew Test output\n✓ #11 my-test-branch:668a5ce succeeded\n')
      })
    })
  })
})
