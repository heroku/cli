import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as sinon from 'sinon'

import ReviewappsDisable from '../../../../src/commands/reviewapps/disable.js'

type FakePlatform = {
  pipeline: {
    info: sinon.SinonStub
  }
  reviewAppConfig: {
    delete: sinon.SinonStub
    resolveRepoName: sinon.SinonStub
    update: sinon.SinonStub
  }
  withOptions: sinon.SinonStub
}

function buildFakePlatform() {
  const scopedDelete = sinon.stub()
  const fakePlatform: FakePlatform = {
    pipeline: {
      info: sinon.stub(),
    },
    reviewAppConfig: {
      delete: sinon.stub(),
      resolveRepoName: sinon.stub(),
      update: sinon.stub(),
    },
    withOptions: sinon.stub().returns({
      reviewAppConfig: {
        delete: scopedDelete,
      },
    }),
  }

  return {fakePlatform, scopedDelete}
}

describe('reviewapps:disable', function () {
  const mutationResult = {id: 'review-app-config'}
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline',
  }
  const repo = 'james/repo'
  let fakePlatform: FakePlatform
  let scopedDelete: sinon.SinonStub

  beforeEach(function () {
    ({fakePlatform, scopedDelete} = buildFakePlatform())
    fakePlatform.pipeline.info.resolves(pipeline)
    fakePlatform.reviewAppConfig.resolveRepoName.resolves(repo)
    fakePlatform.reviewAppConfig.update.resolves(mutationResult)
    scopedDelete.resolves(mutationResult)
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    if (ux.action.running) ux.action.stop()

    sinon.restore()
  })

  it('resolves the pipeline and repository before disabling review apps by default', async function () {
    const requestBody = {
      automatic_review_apps: undefined,
      destroy_stale_apps: undefined,
      pipeline: pipeline.id,
      repo,
      wait_for_ci: undefined,
    }

    const {result, stderr} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`])

    expect(fakePlatform.pipeline.info.calledOnceWithExactly(pipeline.name)).to.equal(true)
    expect(fakePlatform.reviewAppConfig.resolveRepoName.calledOnceWithExactly(pipeline.id)).to.equal(true)
    expect(fakePlatform.withOptions.calledOnceWithExactly({body: requestBody})).to.equal(true)
    expect(scopedDelete.calledOnceWithExactly(pipeline.id)).to.equal(true)
    expect(fakePlatform.reviewAppConfig.delete.called).to.equal(false)
    expect(fakePlatform.reviewAppConfig.update.called).to.equal(false)
    expect(stderr).to.include('Configuring pipeline... done\n')
    expect(result).to.deep.equal(mutationResult)
  })

  const adjustmentCases = [
    {
      expectedOutput: 'Disabling auto deployment',
      expectedSettings: {automatic_review_apps: false},
      flag: '--no-autodeploy',
    },
    {
      expectedOutput: 'Disabling auto deployment',
      expectedSettings: {automatic_review_apps: false},
      flag: '--autodeploy',
    },
    {
      expectedOutput: 'Disabling auto destroy',
      expectedSettings: {destroy_stale_apps: false},
      flag: '--no-autodestroy',
    },
    {
      expectedOutput: 'Disabling auto destroy',
      expectedSettings: {destroy_stale_apps: false},
      flag: '--autodestroy',
    },
    {
      expectedOutput: 'Disabling wait for CI',
      expectedSettings: {wait_for_ci: false},
      flag: '--no-wait-for-ci',
    },
    {
      expectedOutput: 'Disabling wait for CI',
      expectedSettings: {wait_for_ci: false},
      flag: '--wait-for-ci',
    },
  ]

  for (const {expectedOutput, expectedSettings, flag} of adjustmentCases) {
    it(`updates review apps with ${flag}`, async function () {
      const {result, stderr, stdout} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`, flag])

      expect(fakePlatform.reviewAppConfig.resolveRepoName.calledOnceWithExactly(pipeline.id)).to.equal(true)
      expect(fakePlatform.reviewAppConfig.update.calledOnceWithExactly(pipeline.id, {
        automatic_review_apps: undefined,
        destroy_stale_apps: undefined,
        pipeline: pipeline.id,
        repo,
        wait_for_ci: undefined,
        ...expectedSettings,
      })).to.equal(true)
      expect(fakePlatform.withOptions.called).to.equal(false)
      expect(scopedDelete.called).to.equal(false)
      expect(fakePlatform.reviewAppConfig.delete.called).to.equal(false)
      expect(stdout).to.include(expectedOutput)
      expect(stderr).to.include('Configuring pipeline... done\n')
      expect(result).to.deep.equal(mutationResult)
    })
  }

  it('updates review apps once with all negative adjustments', async function () {
    const {result, stderr, stdout} = await runCommand(ReviewappsDisable, [
      `--pipeline=${pipeline.name}`,
      '--no-autodeploy',
      '--no-autodestroy',
      '--no-wait-for-ci',
    ])

    expect(fakePlatform.reviewAppConfig.resolveRepoName.calledOnceWithExactly(pipeline.id)).to.equal(true)
    expect(fakePlatform.reviewAppConfig.update.calledOnceWithExactly(pipeline.id, {
      automatic_review_apps: false,
      destroy_stale_apps: false,
      pipeline: pipeline.id,
      repo,
      wait_for_ci: false,
    })).to.equal(true)
    expect(fakePlatform.withOptions.called).to.equal(false)
    expect(scopedDelete.called).to.equal(false)
    expect(fakePlatform.reviewAppConfig.delete.called).to.equal(false)
    expect(stdout).to.include('Disabling auto deployment')
    expect(stdout).to.include('Disabling auto destroy')
    expect(stdout).to.include('Disabling wait for CI')
    expect(stderr).to.include('Configuring pipeline... done\n')
    expect(result).to.deep.equal(mutationResult)
  })

  it('preserves the app flag warning', async function () {
    const {stderr} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`, '--app=my-app'])

    expect(stderr).to.include('Specifying an app via --app or --remote is no longer needed with')
    expect(stderr).to.include('Review Apps')
  })

  it('resolves the app from a remote while disabling review apps', async function () {
    const originalCwd = process.cwd()
    const originalHerokuApp = process.env.HEROKU_APP
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reviewapps-disable-'))
    const requestBody = {
      automatic_review_apps: undefined,
      destroy_stale_apps: undefined,
      pipeline: pipeline.id,
      repo,
      wait_for_ci: undefined,
    }

    try {
      delete process.env.HEROKU_APP
      execFileSync('git', ['init', '--quiet'], {cwd: tempDir})
      execFileSync('git', ['remote', 'add', 'staging', 'https://git.heroku.com/remote-app.git'], {cwd: tempDir})
      process.chdir(tempDir)

      const {result, stderr} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`, '--remote=staging'])

      expect(stderr).to.include('Specifying an app via --app or --remote is no longer needed with')
      expect(stderr).to.include('Review Apps')
      expect(fakePlatform.withOptions.calledOnceWithExactly({body: requestBody})).to.equal(true)
      expect(scopedDelete.calledOnceWithExactly(pipeline.id)).to.equal(true)
      expect(fakePlatform.reviewAppConfig.update.called).to.equal(false)
      expect(result).to.deep.equal(mutationResult)
    } finally {
      process.chdir(originalCwd)
      if (originalHerokuApp === undefined) delete process.env.HEROKU_APP
      else process.env.HEROKU_APP = originalHerokuApp

      fs.rmSync(tempDir, {force: true, recursive: true})
    }
  })

  it('does not resolve a repository or mutate when pipeline lookup fails', async function () {
    fakePlatform.pipeline.info.rejects(new Error('pipeline failed'))

    const {error, stderr} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`])

    expect(error?.message).to.equal('pipeline failed')
    expect(stderr).not.to.include('done')
    expect(fakePlatform.reviewAppConfig.resolveRepoName.called).to.equal(false)
    expect(fakePlatform.reviewAppConfig.update.called).to.equal(false)
    expect(fakePlatform.withOptions.called).to.equal(false)
    expect(scopedDelete.called).to.equal(false)
    expect(fakePlatform.reviewAppConfig.delete.called).to.equal(false)
  })

  it('does not mutate when repository resolution fails', async function () {
    fakePlatform.reviewAppConfig.resolveRepoName.rejects(new Error('repository failed'))

    const {error, stderr} = await runCommand(ReviewappsDisable, [`--pipeline=${pipeline.name}`])

    expect(error?.message).to.equal('repository failed')
    expect(stderr).not.to.include('done')
    expect(fakePlatform.reviewAppConfig.update.called).to.equal(false)
    expect(fakePlatform.withOptions.called).to.equal(false)
    expect(scopedDelete.called).to.equal(false)
    expect(fakePlatform.reviewAppConfig.delete.called).to.equal(false)
  })
})
