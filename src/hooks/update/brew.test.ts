jest.mock('fs-extra')
jest.mock('child_process')

const fs = require('fs-extra')
const { spawnSync } = require('child_process')

import Brew from './brew'

let config = { platform: 'darwin' } as any

beforeEach(() => {
  jest.resetAllMocks()
})

test('does not migrate when bin is not found', async () => {
  const brew = new Brew(config)
  fs.realpathSync.mockImplementation(() => {
    throw new ErrorEvent('ENOENT')
  })
  await brew.run()
  expect(fs.realpathSync).toBeCalledWith('/usr/local/bin/heroku')
  expect(spawnSync).not.toBeCalled()
})

test('does not migrate when bin is not in /usr/local/Cellar', async () => {
  const brew = new Brew(config)
  fs.realpathSync.mockReturnValue('/usr/local/Cellar/heroku/6.0.0/bin/heroku')
  spawnSync.mockReturnValueOnce({ stdout: 'foo\nheroku/brew\nbar\n' })
  await brew.run()
  expect(spawnSync.mock.calls.length).toEqual(1)
  expect(spawnSync.mock.calls[0]).toEqual(['brew', ['tap'], { encoding: 'utf8', stdio: [0, 'pipe', 2] }])
})

test('migrates', async () => {
  const brew = new Brew(config)
  fs.realpathSync.mockReturnValue('/usr/local/Cellar/heroku/6.0.0/bin/heroku')
  spawnSync.mockReturnValueOnce({ stdout: 'foo\nbar\n' })
  await brew.run()
  expect(spawnSync.mock.calls.length).toEqual(3)
  expect(spawnSync.mock.calls[1]).toEqual(['brew', ['tap', 'heroku/brew'], { encoding: 'utf8', stdio: 'inherit' }])
  expect(spawnSync.mock.calls[2]).toEqual([
    'brew',
    ['upgrade', 'heroku/brew/heroku'],
    { encoding: 'utf8', stdio: 'inherit' },
  ])
})
