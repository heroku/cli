'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let deliveries = yield heroku.get(`/apps/${context.app}/webhook-deliveries`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
  })
  if (deliveries.length === 0) {
    cli.log(`${cli.color.app(context.app)} has no deliveries`)
  } else {
    let code = (w) => {
      return (w.last_attempt && w.last_attempt.code && w.last_attempt.code + '') || ''
    }

    deliveries.sort((a, b) => Date.parse(a['created_at']) - Date.parse(b['created_at']))

    cli.table(deliveries, {columns: [
      {key: 'id', label: 'Delivery ID'},
      {key: 'created_at', label: 'Created', get: (w) => w.created_at},
      {key: 'status', label: 'Status', get: (w) => w.status},
      {key: 'include', label: 'Include', get: (w) => w.event.include},
      {key: 'level', label: 'Level', get: (w) => w.webhook.level},
      {key: 'num_attempts', label: 'Attempts', get: (w) => w.num_attempts + ''},
      {key: 'last_code', label: 'Code', get: code},
      {key: 'last_error', label: 'Error', get: (w) => (w.last_attempt && w.last_attempt.error_class) || ''},
      {key: 'next_attempt_at', label: 'Next Attempt', get: (w) => w.next_attempt_at || ''}
    ]})
  }
}

module.exports = {
  topic: 'webhooks',
  command: 'deliveries',
  description: 'list webhook deliveries on an app',
  help: `Example:

 $ heroku webhooks:deliveries
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
