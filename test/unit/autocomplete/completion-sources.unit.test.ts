import {Config} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

import type {CompletionContext} from '../../../src/lib/types/completion.js'

import {
  AppCompletion,
  BuildpackCompletion,
  completionCatalog,
  DynoSizeCompletion,
  PipelineCompletion,
  ProcessTypeCompletion,
  RegionCompletion,
  RemoteCompletion,
  RoleCompletion,
  ScopeCompletion,
  SpaceCompletion,
  StackCompletion,
  StageCompletion,
  TeamCompletion,
} from '../../../src/lib/autocomplete/completions.js'
import {mockSDKPlatform} from '../../helpers/mock-sdk.js'

/**
 * Exercises the completion value sources themselves — the `options`/`cacheKey`
 * closures in completions.ts — where the sibling inject/shell-exec tests only
 * cover the plumbing that wires them. The SDK-backed sources run against a
 * stubbed platform (no network), the local sources against a real Procfile and
 * git remote in a scratch cwd, and the static sources are asserted verbatim.
 */
describe('autocomplete completion sources', function () {
  this.timeout(120_000)

  let config: Config
  let ctx: CompletionContext

  before(async function () {
    config = await Config.load(process.cwd())
    ctx = {config}
  })

  describe('static completions (fixed value sets, no auth, no I/O)', function () {
    it('BuildpackCompletion offers the official buildpacks', function () {
      const values = BuildpackCompletion.options(ctx) as string[]
      expect(values).to.include('heroku/ruby').and.to.include('heroku/nodejs')
    })

    it('RoleCompletion offers the collaborator roles', function () {
      expect(RoleCompletion.options(ctx)).to.deep.equal(['admin', 'collaborator', 'member', 'owner'])
    })

    it('ScopeCompletion offers the authorization scopes', function () {
      expect(ScopeCompletion.options(ctx)).to.include('global').and.to.include('read-protected')
    })

    it('StageCompletion offers the pipeline stages', function () {
      expect(StageCompletion.options(ctx)).to.deep.equal(['test', 'review', 'development', 'staging', 'production'])
    })
  })

  describe('local-context completions (read cwd state, no auth, no network)', function () {
    let originalCwd: string
    let scratch: string

    beforeEach(function () {
      originalCwd = process.cwd()
      scratch = mkdtempSync(path.join(tmpdir(), 'heroku-ac-src-'))
      process.chdir(scratch)
    })

    afterEach(function () {
      process.chdir(originalCwd)
      rmSync(scratch, {force: true, recursive: true})
    })

    it('ProcessTypeCompletion reads the dyno types from a cwd Procfile', async function () {
      writeFileSync(path.join(scratch, 'Procfile'), 'web: node server.js\nworker: ./run\n\n')
      expect(await ProcessTypeCompletion.options(ctx)).to.deep.equal(['web', 'worker'])
    })

    it('ProcessTypeCompletion is empty when there is no Procfile', async function () {
      expect(await ProcessTypeCompletion.options(ctx)).to.deep.equal([])
    })

    it('RemoteCompletion lists the git remotes in the cwd repo', function () {
      execFileSync('git', ['init'], {cwd: scratch, stdio: 'ignore'})
      execFileSync('git', ['remote', 'add', 'heroku', 'https://git.heroku.com/x.git'], {cwd: scratch, stdio: 'ignore'})
      expect(RemoteCompletion.options(ctx)).to.deep.equal(['heroku'])
    })

    it('RemoteCompletion is empty outside a git repository', function () {
      // scratch is a bare temp dir with no .git; `git remote` exits non-zero.
      expect(RemoteCompletion.options(ctx)).to.deep.equal([])
    })
  })

  describe('SDK-backed completions (stubbed platform — no network)', function () {
    const named = (names: string[]) => names.map(name => ({name}))
    let restore: () => void

    beforeEach(function () {
      const platform = {
        app: {listOwnedAndCollaborated: async () => named(['charlie', 'alpha'])},
        dynoSize: {list: async () => named(['Standard-1X', 'Performance-M'])},
        pipeline: {list: async () => named(['pipe'])},
        region: {list: async () => named(['us', 'eu'])},
        space: {list: async () => named(['space'])},
        team: {list: async () => named(['team-b', 'team-a'])},
        withOptions() {
          return this
        },
      }
      restore = mockSDKPlatform(platform).restore
    })

    afterEach(function () {
      restore()
    })

    it('AppCompletion returns the account apps, sorted', async function () {
      expect(await AppCompletion.options(ctx)).to.deep.equal(['alpha', 'charlie'])
    })

    it('TeamCompletion returns the teams, sorted', async function () {
      expect(await TeamCompletion.options(ctx)).to.deep.equal(['team-a', 'team-b'])
    })

    it('PipelineCompletion returns the pipelines', async function () {
      expect(await PipelineCompletion.options(ctx)).to.deep.equal(['pipe'])
    })

    it('SpaceCompletion returns the spaces', async function () {
      expect(await SpaceCompletion.options(ctx)).to.deep.equal(['space'])
    })

    it('RegionCompletion returns the regions, sorted', async function () {
      expect(await RegionCompletion.options(ctx)).to.deep.equal(['eu', 'us'])
    })

    it('DynoSizeCompletion lower-cases and sorts the dyno sizes', async function () {
      expect(await DynoSizeCompletion.options(ctx)).to.deep.equal(['performance-m', 'standard-1x'])
    })
  })

  describe('StackCompletion (direct /stacks fetch)', function () {
    afterEach(function () {
      nock.cleanAll()
    })

    it('lists stack names from the /stacks collection, sorted', async function () {
      nock('https://api.heroku.com')
        .get('/stacks')
        .reply(200, [{name: 'heroku-24'}, {name: 'heroku-22'}])
      expect(await StackCompletion.options(ctx)).to.deep.equal(['heroku-22', 'heroku-24'])
    })
  })

  describe('cache keys', function () {
    it('account-scoped completions build an account+host cache key', async function () {
      for (const completion of [AppCompletion, TeamCompletion, PipelineCompletion, SpaceCompletion]) {
        const key = await completion.cacheKey!(ctx)
        expect(key).to.match(/@api\.heroku\.com#/)
      }
    })

    it('host-scoped completions build a host-only cache key (no token component)', async function () {
      for (const completion of [RegionCompletion, StackCompletion, DynoSizeCompletion]) {
        const key = await completion.cacheKey!(ctx)
        expect(key).to.match(/@api\.heroku\.com$/)
      }
    })
  })

  it('every catalog id resolves to a completion with an options source', function () {
    for (const [id, completion] of Object.entries(completionCatalog)) {
      expect(completion.options, `${id} must expose options`).to.be.a('function')
    }
  })
})
