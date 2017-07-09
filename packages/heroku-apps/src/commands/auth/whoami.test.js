// @flow

import Whoami from './whoami'
import nock from 'nock'

let mockMachines

jest.mock('netrc-parser', () => class {
  machines = mockMachines
})

let api

beforeEach(() => {
  api = nock('https://api.heroku.com')
})

afterEach(() => {
  api.done()
})

describe('not logged in', () => {
  beforeEach(() => {
    mockMachines = {
      'api.heroku.com': {}
    }
  })

  it('errors', async () => {
    expect.assertions(1)
    try {
      await Whoami.mock()
    } catch (err) {
      expect(err.code).toEqual(100)
    }
  })
})

describe('logged in', () => {
  beforeEach(() => {
    mockMachines = {
      'api.heroku.com': {password: 'myapikey'}
    }
  })

  it('shows login', async () => {
    api.get('/account')
      .reply(200, {email: 'user@heroku.com'})
    let cmd = await Whoami.mock()
    expect(cmd.out.stdout.output).toEqual('user@heroku.com\n')
  })
})
