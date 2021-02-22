'use strict'
/* globals describe beforeEach it commands */

const cli = require('heroku-cli-util')
const expect = require('chai').expect
const nock = require('nock')
const unwrap = require('../../unwrap.js')
const cmd = commands.find((c) => c.topic === 'apps' && c.command === 'rename')

describe('heroku apps:rename', function () {
  beforeEach(() => cli.mockConsole())

  it('renames an app', async function() {
    let api = nock('https://api.heroku.com')
      .patch('/apps/myapp', { name: 'newname' })
      .reply(200, {
        name: 'foobar',
        web_url: 'https://foobar.com'
      })

    await cmd.run({ app: 'myapp', flags: {}, args: { newname: 'newname' }, httpGitHost: 'git.heroku.com' })

    expect(unwrap(cli.stderr)).to.equal(`Renaming myapp to newname... done Don't forget to update git remotes for all other local checkouts of the app.
`);

    expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n');

    return api.done()
  })
})
