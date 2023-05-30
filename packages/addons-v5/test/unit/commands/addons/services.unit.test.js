'use strict'
/* globals commands nock cli expect beforeEach */

let cmd = commands.find(c => c.topic === 'addons' && c.command === 'services')

describe('addons:services', function () {
  beforeEach(() => cli.mockConsole())

  it('shows addon services', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services')
      .reply(200, [
        {name: 'foo', human_name: 'Foo', state: 'ga'},
        {name: 'bar', human_name: 'Bar', state: 'ga'},
      ])
    return cmd.run({flags: {}})
      .then(() => expect(cli.stdout).to.equal(`slug  name  state
────  ────  ─────
foo   Foo   ga
bar   Bar   ga

See plans with heroku addons:plans SERVICE
`))
      .then(() => api.done())
  })
})
