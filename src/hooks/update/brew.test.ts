jest.mock('child_process')

import * as path from 'path'
const { spawnSync } = require('child_process')

import Config from '../../__test__/config'
import { withFiles } from '../../__test__/file'
import { skipIfWindows } from '../../__test__/init'

import Brew from './brew'

let config: Config

let env = process.env
beforeEach(() => {
  config = new Config({ platform: 'darwin' })
  process.env.HOMEBREW_PREFIX = path.join(config.dataDir, '/usr/local')
  jest.resetAllMocks()
})

afterEach(() => {
  process.env = env
})

skipIfWindows('migrates', async () => {
  let hb = process.env.HOMEBREW_PREFIX!
  await withFiles(
    {
      'bin/heroku': { type: 'symlink', to: path.join(hb, 'Cellar/heroku/6.15.2/bin/heroku') },
      'Cellar/heroku/6.15.2/bin/heroku': 'foo',
      'Cellar/heroku/6.15.2/INSTALL_RECEIPT.json': { type: 'file', content: { source: { tap: 'homebrew/core' } } },
    },
    { root: process.env.HOMEBREW_PREFIX },
  )
  const brew = new Brew(config)
  await brew.run()
  expect(spawnSync.mock.calls.length).toEqual(2)
  expect(spawnSync.mock.calls[0]).toEqual(['brew', ['tap', 'heroku/brew'], { encoding: 'utf8', stdio: 'inherit' }])
  expect(spawnSync.mock.calls[1]).toEqual([
    'brew',
    ['upgrade', 'heroku/brew/heroku'],
    { encoding: 'utf8', stdio: 'inherit' },
  ])
})

skipIfWindows('does not migrate if already migrated', async () => {
  let hb = process.env.HOMEBREW_PREFIX!
  await withFiles(
    {
      'bin/heroku': { type: 'symlink', to: path.join(hb, 'Cellar/heroku/6.15.2/bin/heroku') },
      'Cellar/heroku/6.15.2/bin/heroku': 'foo',
      'Cellar/heroku/6.15.2/INSTALL_RECEIPT.json': { type: 'file', content: { source: { tap: 'heroku/brew' } } },
    },
    { root: process.env.HOMEBREW_PREFIX },
  )
  const brew = new Brew(config)
  await brew.run()
  expect(spawnSync).not.toBeCalled()
})
