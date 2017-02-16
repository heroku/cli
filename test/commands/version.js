const {describe, it} = require('mocha')
const exec = require('heroku-cli-test')(require('../../commands'))

describe('version', () => {
  it('shows the version', async function () {
    let {stdout} = await exec('version')
    stdout.should.match(/^heroku-cli/)
  })
})
