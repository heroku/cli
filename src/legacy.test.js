// @flow

import {type LegacyCommand, convertFromV5} from './legacy'

jest.mock('cli-engine-heroku/lib/vars', () => ({
  apiHost: 'api.foo.com',
  apiUrl: 'https://api.foo.com',
  gitHost: 'foo.com',
  httpGitHost: 'git.foo.com'
}))

jest.mock('cli-engine-heroku/lib/api_client', () => {
  return function () {
    return {auth: '1234'}
  }
})

test('exports a context', async function () {
  let ctx = {}
  let l: LegacyCommand = {
    topic: 'foo',
    command: 'bar',
    args: [],
    flags: [],
    run: function (context) {
      ctx = context
      return Promise.resolve()
    }
  }

  let V5 = convertFromV5(l)
  let cmd = new V5({config: {cacheDir: '/Users/foo/.cache/heroku'}})
  cmd.argv = []
  await cmd.run()

  expect(ctx.supportsColor).toEqual(cmd.out.color.enabled)
  expect(ctx.debug).toEqual(0)
  expect(ctx.apiToken).toEqual('1234')
  expect(ctx.apiHost).toEqual('api.foo.com')
  expect(ctx.apiUrl).toEqual('https://api.foo.com')
  expect(ctx.herokuDir).toEqual('/Users/foo/.cache/heroku')
  expect(ctx.gitHost).toEqual('foo.com')
  expect(ctx.httpGitHost).toEqual('git.foo.com')
  expect(ctx.auth.password).toEqual('1234')
})

test('add apps & orgs flags for needsApp & wantsOrg', async function () {
  let l: LegacyCommand = {
    topic: 'foo',
    command: 'bar',
    args: [],
    flags: [],
    needsApp: true,
    wantsOrg: true,
    run: function (context) {
      return Promise.resolve()
    }
  }

  let V5 = convertFromV5(l)
  expect(Object.keys(V5.flags)).toEqual(['app', 'remote', 'org'])
})
