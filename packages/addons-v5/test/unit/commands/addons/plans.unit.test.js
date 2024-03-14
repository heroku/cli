'use strict'
/* globals beforeEach cli commands nock expect */

let cmd = commands.find(c => c.topic === 'addons' && c.command === 'plans')

describe('addons:plans', function () {
  beforeEach(() => cli.mockConsole())

  it('shows add-on plans', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/daservice/plans')
      .reply(200, [
        {name: 'first', human_name: 'First', price: {cents: 0, unit: 'month', contract: false}, default: true},
        {name: 'second', human_name: 'Second', price: {cents: 2000, unit: 'month', contract: false}, default: false},
        {name: 'third', human_name: 'Third', price: {cents: 10000, unit: 'month', contract: false}, default: false},
        {name: 'fourth', human_name: 'Fourth', price: {cents: 0, unit: 'month', contract: true}, default: false},
      ])
    return cmd.run({args: {service: 'daservice'}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`         slug    name    price         max price
───────  ──────  ──────  ────────────  ──────────
default  first   First   free          free
         second  Second  ~$0.028/hour  $20/month
         third   Third   ~$0.139/hour  $100/month
         fourth  Fourth  contract      contract
`))
      .then(() => api.done())
  })
})
