// @flow

import Cmd from '.'
import nock from 'nock'

let api
beforeEach(() => {
  api = nock('https://api.heroku.com')
})

afterEach(() => {
  api.done()
})

describe('with regions', () => {
  beforeEach(() => {
    api
      .get('/regions')
      .reply(200, [
        {name: 'eu', description: 'Europe', private_capable: false},
        {name: 'us', description: 'United States', private_capable: false},
        {name: 'oregon', description: 'Oregon, United States', private_capable: true}
      ])
  })
  test('list regions', async () => {
    let {stdout, stderr} = await Cmd.mock()
    expect(stderr).toEqual('')
    expect(stdout).toEqual(`ID      Location               Runtime
──────  ─────────────────────  ──────────────
eu      Europe                 Common Runtime
us      United States          Common Runtime
oregon  Oregon, United States  Private Spaces
`)
  })
  test('--private', async () => {
    let {stdout, stderr} = await Cmd.mock(['--private'])
    expect(stderr).toEqual('')
    expect(stdout).toEqual(`ID      Location               Runtime
──────  ─────────────────────  ──────────────
oregon  Oregon, United States  Private Spaces
`)
  })
  test('--common', async () => {
    let {stdout, stderr} = await Cmd.mock(['--common'])
    expect(stderr).toEqual('')
    expect(stdout).toEqual(`ID  Location       Runtime
──  ─────────────  ──────────────
eu  Europe         Common Runtime
us  United States  Common Runtime
`)
  })
  test('--json', async () => {
    let {stdout, stderr} = await Cmd.mock(['--json'])
    expect(stderr).toEqual('')
    expect(JSON.parse(stdout)[0].name).toEqual(`eu`)
  })
})
