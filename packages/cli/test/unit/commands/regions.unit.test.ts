import {expect, test} from '@oclif/test'

const withRegions = test
  .nock('https://api.heroku.com', api => api
    .get('/regions')
    .reply(200, [
      {name: 'eu', description: 'Europe', private_capable: false},
      {name: 'us', description: 'United States', private_capable: false},
      {name: 'oregon', description: 'Oregon, United States', private_capable: true},
    ]),
  )

describe('regions', function () {
  withRegions
    .stdout()
    .command(['regions'])
    .it('list regions', async ({stdout}) => {
      expect(stdout).to.equal(' ID     Location              Runtime        \n ────── ───────────────────── ────────────── \n eu     Europe                Common Runtime \n us     United States         Common Runtime \n oregon Oregon, United States Private Spaces \n')
    })

  withRegions
    .stdout()
    .command(['regions', '--private'])
    .it('--private', async ({stdout}) => {
      expect(stdout).to.equal(' ID     Location              Runtime        \n ────── ───────────────────── ────────────── \n oregon Oregon, United States Private Spaces \n')
    })

  withRegions
    .stdout()
    .command(['regions', '--common'])
    .it('--common', async ({stdout}) => {
      expect(stdout).to.equal(' ID Location      Runtime        \n ── ───────────── ────────────── \n eu Europe        Common Runtime \n us United States Common Runtime \n')
    })

  withRegions
    .stdout()
    .command(['regions', '--json'])
    .it('--json', async ({stdout}) => {
      expect(JSON.parse(stdout)[0].name).to.equal('eu')
    })
})
