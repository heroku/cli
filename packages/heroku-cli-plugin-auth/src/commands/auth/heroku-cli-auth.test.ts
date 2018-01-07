import HelloWorld from './heroku-cli-auth'

test('it says hello to the world', async () => {
  const { stdout } = await HelloWorld.mock()
  expect(stdout).toEqual('hello world from heroku-cli-auth!\n')
})

test('it says hello to jeff', async () => {
  const { stdout } = await HelloWorld.mock(['--name', 'jeff'])
  expect(stdout).toEqual('hello jeff from heroku-cli-auth!\n')
})
