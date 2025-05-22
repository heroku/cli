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
      expect(stdout).to.include('ID       Location                Runtime')
      expect(stdout).to.include('─────────────────────────────────────────────────')
      expect(stdout).to.include('eu       Europe                  Common Runtime')
      expect(stdout).to.include('us       United States           Common Runtime')
    })

  withRegions
    .stdout()
    .command(['regions', '--private'])
    .it('--private', async ({stdout}) => {
      expect(stdout).to.include('ID       Location                Runtime')
      expect(stdout).to.include('─────────────────────────────────────────────────')
      expect(stdout).to.include('oregon   Oregon, United States   Private Spaces')
    })

  withRegions
    .stdout()
    .command(['regions', '--common'])
    .it('--common', async ({stdout}) => {
      expect(stdout).to.include('ID   Location        Runtime')
      expect(stdout).to.include('─────────────────────────────────────')
      expect(stdout).to.include('eu   Europe          Common Runtime')
      expect(stdout).to.include('us   United States   Common Runtime')
    })

  withRegions
    .stdout()
    .command(['regions', '--json'])
    .it('--json', async ({stdout}) => {
      expect(JSON.parse(stdout)[0].name).to.equal('eu')
    })
})
