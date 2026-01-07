import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {PassThrough} from 'node:stream'
import {gitService, fileService} from '../../../../src/lib/ci/source.js'
import {got} from 'got'
import customRunCommand from '../../../helpers/runCommand.js'
import Cmd from '../../../../src/commands/ci/rerun.js'
import {stdout} from 'stdout-stderr'

describe('ci:rerun', function () {
  afterEach(() => nock.cleanAll())

  it('errors when not specifying a pipeline or an app', async () => {
    try {
      await customRunCommand(Cmd, [])
    } catch (error: any) {
      expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    }
  })

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
    let sandbox: ReturnType<typeof sinon.createSandbox>

    beforeEach(function () {
      sandbox = sinon.createSandbox()

      // Stub gitService methods
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

    describe('when not specifying a run #', function () {
      it('it runs the test and displays the test output for the first node', async () => {
        nock('https://api.heroku.com')
          .get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {id: pipeline.id},
          ])
          .get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, [oldTestRun])
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
              id: newTestRun.id,
              number: newTestRun.number,
              pipeline: {id: pipeline.id},
              exit_code: 0,
              status: newTestRun.status,
              setup_stream_url: `https://test-setup-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
              output_stream_url: `https://test-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
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

        await customRunCommand(Cmd, [`--pipeline=${pipeline.name}`])

        expect(stdout.output).to.equal('Rerunning test run #10...\nNew Test setup outputNew Test output\n✓ #11 my-test-branch:668a5ce succeeded\n')
      })
    })

    describe('when specifying a run #', function () {
      it('it runs the test and displays the test output for the first node', async () => {
        nock('https://api.heroku.com')
          .get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {id: pipeline.id},
          ])
          .get(`/pipelines/${pipeline.id}/test-runs/${oldTestRun.number}`)
          .reply(200, oldTestRun)
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
              id: newTestRun.id,
              number: newTestRun.number,
              pipeline: {id: pipeline.id},
              exit_code: 0,
              status: newTestRun.status,
              setup_stream_url: `https://test-setup-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
              output_stream_url: `https://test-output.heroku.com/streams/${newTestRun.id.slice(0, 3)}/test-runs/${newTestRun.id}`,
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

        await customRunCommand(Cmd, [`${oldTestRun.number}`, `--pipeline=${pipeline.name}`])

        expect(stdout.output).to.equal('Rerunning test run #10...\nNew Test setup outputNew Test output\n✓ #11 my-test-branch:668a5ce succeeded\n')
      })
    })
  })
})
