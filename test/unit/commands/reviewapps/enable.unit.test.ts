import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as sinon from 'sinon'

import ReviewappsEnable from '../../../../src/commands/reviewapps/enable.js'

type FakePlatform = {
  pipeline: {
    info: sinon.SinonStub
  }
  reviewAppConfig: {
    enable: sinon.SinonStub
    resolveRepoName: sinon.SinonStub
    update: sinon.SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    pipeline: {
      info: sinon.stub(),
    },
    reviewAppConfig: {
      enable: sinon.stub(),
      resolveRepoName: sinon.stub(),
      update: sinon.stub(),
    },
  }
}

describe('reviewapps:enable', function () {
  const mutationResult = {id: 'review-app-config'}
  const pipeline = {
    id: '123-pipeline',
    name: 'my-pipeline',
  }
  const repo = 'james/repo'
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    fakePlatform.pipeline.info.resolves(pipeline)
    fakePlatform.reviewAppConfig.resolveRepoName.resolves(repo)
    fakePlatform.reviewAppConfig.enable.resolves(mutationResult)
    fakePlatform.reviewAppConfig.update.resolves(mutationResult)
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    if (ux.action.running) ux.action.stop()

    sinon.restore()
  })

  it('resolves the pipeline and repository before enabling review apps by default', async function () {
    const {result, stderr} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`])

    expect(fakePlatform.pipeline.info.calledOnceWithExactly(pipeline.name)).to.equal(true)
    expect(fakePlatform.reviewAppConfig.resolveRepoName.calledOnceWithExactly(pipeline.id)).to.equal(true)
    expect(fakePlatform.reviewAppConfig.enable.calledOnceWithExactly(pipeline.id, {
      automatic_review_apps: undefined,
      destroy_stale_apps: undefined,
      pipeline: pipeline.id,
      repo,
      wait_for_ci: undefined,
    })).to.equal(true)
    expect(fakePlatform.reviewAppConfig.update.called).to.equal(false)
    expect(stderr).to.include('Configuring pipeline... done\n')
    expect(result).to.deep.equal(mutationResult)
  })

  const adjustmentCases = [
    {
      expectedOutput: 'Enabling auto deployment',
      expectedSettings: {automatic_review_apps: true},
      flag: '--autodeploy',
    },
    {
      expectedOutput: 'Enabling auto destroy',
      expectedSettings: {destroy_stale_apps: true},
      flag: '--autodestroy',
    },
    {
      expectedOutput: 'Enabling wait for CI',
      expectedSettings: {wait_for_ci: true},
      flag: '--wait-for-ci',
    },
  ]

  for (const {expectedOutput, expectedSettings, flag} of adjustmentCases) {
    it(`updates review apps with ${flag}`, async function () {
      const {result, stderr, stdout} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`, flag])

      expect(fakePlatform.reviewAppConfig.update.calledOnceWithExactly(pipeline.id, {
        automatic_review_apps: undefined,
        destroy_stale_apps: undefined,
        pipeline: pipeline.id,
        repo,
        wait_for_ci: undefined,
        ...expectedSettings,
      })).to.equal(true)
      expect(fakePlatform.reviewAppConfig.enable.called).to.equal(false)
      expect(stdout).to.include(expectedOutput)
      expect(stderr).to.include('Configuring pipeline... done\n')
      expect(result).to.deep.equal(mutationResult)
    })
  }

  it('updates review apps once with all adjustments', async function () {
    const {stdout} = await runCommand(ReviewappsEnable, [
      `--pipeline=${pipeline.name}`,
      '--autodeploy',
      '--autodestroy',
      '--wait-for-ci',
    ])

    expect(fakePlatform.reviewAppConfig.update.calledOnceWithExactly(pipeline.id, {
      automatic_review_apps: true,
      destroy_stale_apps: true,
      pipeline: pipeline.id,
      repo,
      wait_for_ci: true,
    })).to.equal(true)
    expect(fakePlatform.reviewAppConfig.enable.called).to.equal(false)
    expect(stdout).to.include('Enabling auto deployment')
    expect(stdout).to.include('Enabling auto destroy')
    expect(stdout).to.include('Enabling wait for CI')
  })

  it('preserves the app flag warning', async function () {
    const {stderr} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`, '--app=my-app'])

    expect(stderr).to.include('Specifying an app via --app or --remote is no longer needed with')
    expect(stderr).to.include('Review Apps')
  })

  it('resolves the app from a remote while enabling review apps', async function () {
    const originalCwd = process.cwd()
    const originalHerokuApp = process.env.HEROKU_APP
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reviewapps-enable-'))

    try {
      delete process.env.HEROKU_APP
      execFileSync('git', ['init', '--quiet'], {cwd: tempDir})
      execFileSync('git', ['remote', 'add', 'staging', 'https://git.heroku.com/remote-app.git'], {cwd: tempDir})
      process.chdir(tempDir)

      const {result, stderr} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`, '--remote=staging'])

      expect(stderr).to.include('Specifying an app via --app or --remote is no longer needed with')
      expect(stderr).to.include('Review Apps')
      expect(fakePlatform.reviewAppConfig.enable.calledOnceWithExactly(pipeline.id, {
        automatic_review_apps: undefined,
        destroy_stale_apps: undefined,
        pipeline: pipeline.id,
        repo,
        wait_for_ci: undefined,
      })).to.equal(true)
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

    const {error, stderr} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`])

    expect(error?.message).to.equal('pipeline failed')
    expect(stderr).not.to.include('done')
    expect(fakePlatform.reviewAppConfig.resolveRepoName.called).to.equal(false)
    expect(fakePlatform.reviewAppConfig.enable.called).to.equal(false)
    expect(fakePlatform.reviewAppConfig.update.called).to.equal(false)
  })

  it('does not mutate when repository resolution fails', async function () {
    fakePlatform.reviewAppConfig.resolveRepoName.rejects(new Error('repository failed'))

    const {error, stderr} = await runCommand(ReviewappsEnable, [`--pipeline=${pipeline.name}`])

    expect(error?.message).to.equal('repository failed')
    expect(stderr).not.to.include('done')
    expect(fakePlatform.reviewAppConfig.enable.called).to.equal(false)
    expect(fakePlatform.reviewAppConfig.update.called).to.equal(false)
  })
})
