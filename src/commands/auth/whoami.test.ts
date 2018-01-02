import Whoami from './whoami'
import * as nock from 'nock'

let mockMachines: any

jest.mock(
  'netrc-parser',
  () =>
    class {
      machines = mockMachines
    },
)

let api: nock.Scope
let apiKey = process.env.HEROKU_API_KEY

beforeEach(() => {
  delete process.env.HEROKU_API_KEY
  api = nock('https://api.heroku.com')
})

afterEach(() => {
  api.done()
  if (apiKey) process.env.HEROKU_API_KEY = apiKey
})

describe('not logged in', () => {
  beforeEach(() => {
    mockMachines = {
      'api.heroku.com': {},
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
      'api.heroku.com': { password: 'myapikey' },
    }
  })

  it('shows login', async () => {
    api.get('/account').reply(200, { email: 'user@heroku.com' })
    let { stdout } = await Whoami.mock()
    expect(stdout).toEqual('user@heroku.com\n')
  })

  it('has expired token', async () => {
    expect.assertions(1)
    api.get('/account').reply(401)
    try {
      await Whoami.mock()
    } catch (err) {
      expect(err.code).toEqual(100)
    }
  })
})
