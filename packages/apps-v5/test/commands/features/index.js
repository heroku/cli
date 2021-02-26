'use strict'
/* globals commands describe beforeEach it */

const cli = require('heroku-cli-util')
const expect = require('chai').expect
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'features' && !c.command)

describe('features', () => {
  beforeEach(() => cli.mockConsole())

  it('shows the app features', async function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/features')
      .reply(200, [
        { enabled: true, state: 'general', name: 'feature a', description: 'an app feature' }
      ])

    await cmd.run({ app: 'myapp', flags: {} })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== App Features myapp
[+] feature a  an app feature
`);

    return api.done()
  })
})
