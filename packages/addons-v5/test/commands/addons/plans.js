'use strict'
/* globals describe beforeEach cli commands it nock expect */

let cmd = commands.find((c) => c.topic === 'addons' && c.command === 'plans')

describe('addons:plans', function () {
  beforeEach(() => cli.mockConsole())

  it('shows add-on plans', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/daservice/plans')
      .reply(200, [
        {name: 'first', human_name: 'First', price: {cents: 0, unit: 'month'}, default: true},
        {name: 'second', human_name: 'Second', price: {cents: 1000, unit: 'month'}, default: false}
      ])
    return cmd.run({args: {service: 'daservice'}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`         slug    name    price
───────  ──────  ──────  ─────────
default  first   First   free
         second  Second  $10/month
`))
      .then(() => api.done())
  })
})
