// @flow

import Hello from './hello'

test('it says hello to the world', async () => {
  let cmd = await Hello.mock()
  expect(cmd.out.stdout.output).toEqual('hello world!\n')
})

test('it says hello to jeff', async () => {
  let cmd = await Hello.mock('--name', 'jeff')
  expect(cmd.out.stdout.output).toEqual('hello jeff!\n')
})
