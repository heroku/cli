// @flow

import Whoami from './whoami'

const nock = require('nock')
const td = require('testdouble')
const proxyquire = require('proxyquire')

test('it says hello to the world', async () => {
  let cmd = await Whoami.mock()
  expect(cmd.out.stdout.output).toEqual('hello world!\n')
})
