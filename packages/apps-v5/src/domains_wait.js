'use strict'

const cli = require('heroku-cli-util')
// eslint-disable-next-line no-promise-executor-return
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = async function (context, heroku, domain) {
  await cli.action(`Waiting for ${cli.color.green(domain.hostname)}`, (async () => {
    while (domain.status === 'pending') {
      // eslint-disable-next-line no-await-in-loop
      await wait(5000)
      // eslint-disable-next-line no-await-in-loop
      domain = await heroku.get(`/apps/${context.app}/domains/${domain.id}`)
    }

    if (domain.status === 'succeeded' || domain.status === 'none') return
    throw new Error(`The domain creation finished with status ${domain.status}`)
  })())
}
