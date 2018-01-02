import Brew from './brew'

jest.mock('fs-extra')
jest.mock('child_process')
const fs = require('fs-extra')
const { spawnSync } = require('child_process')

test('does notmigrate when bin is not found', async () => {
  const config = {} as any
  const brew = new Brew(config)
  await brew.run()
  expect(fs).not.toBeCalled()
  expect(spawnSync).not.toBeCalled()
})
