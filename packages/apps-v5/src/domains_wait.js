'use strict'

const cli = require('heroku-cli-util')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = async function (context, heroku, domain) {
  await cli.action(`Waiting for ${cli.color.green(domain.hostname)}`, (async () => {
    while (domain.status === 'pending') {
      await wait(5000)
      domain = await heroku.get(`/apps/${context.app}/domains/${domain.id}`)
    }

    if (domain.status === 'succeeded' || domain.status === 'none') return
    throw new Error(`The domain creation finished with status ${domain.status}`)
  })())
}
