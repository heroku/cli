'use strict'

const {Command} = require('heroku-cli-command')

class Update extends Command {
  async run () {
    const got = require('got')
    this.action('heroku-cli: Updating CLI')
    let branch = 'v6'
    let url = `https://cli-assets.heroku.com/branches/${branch}/${process.platform}-${process.arch}`
    let {body: manifest} = await got(url, {json: true})
    this.action(`heroku-cli: Updating CLI to ${this.color.green(manifest.version)}${branch === 'stable' ? '' : ' (' + this.color.yellow(branch) + ')'}`)
    await got(url, {json: true})
    await got(url, {json: true})
    await got(url, {json: true})
    await got(url, {json: true})
    await got(url, {json: true})
  }
}

Update.topic = 'update'

module.exports = Update
