import {expect, test} from '../test'

const withRegions = test
.nock('https://api.heroku.com', api => api
  .get('/regions')
  .reply(200, [
    {name: 'eu', description: 'Europe', private_capable: false},
    {name: 'us', description: 'United States', private_capable: false},
    {name: 'oregon', description: 'Oregon, United States', private_capable: true}
  ])
)

describe('regions', () => {
  withRegions
  .stdout()
  .command(['regions'])
  .it('list regions', async ({stdout}) => {
    expect(stdout).to.equal(`ID      Location               Runtime
──────  ─────────────────────  ──────────────
eu      Europe                 Common Runtime
us      United States          Common Runtime
oregon  Oregon, United States  Private Spaces
`)
  })

  withRegions
  .stdout()
  .command(['regions', '--private'])
  .it('--private', async ({stdout}) => {
    expect(stdout).to.equal(`ID      Location               Runtime
──────  ─────────────────────  ──────────────
oregon  Oregon, United States  Private Spaces
`)
  })

  withRegions
  .stdout()
  .command(['regions', '--common'])
  .it('--common', async ({stdout}) => {
    expect(stdout).to.equal(`ID  Location       Runtime
──  ─────────────  ──────────────
eu  Europe         Common Runtime
us  United States  Common Runtime
`)
  })

  withRegions
  .stdout()
  .command(['regions', '--json'])
  .it('--json', async ({stdout}) => {
    expect(JSON.parse(stdout)[0].name).to.equal('eu')
  })
})
