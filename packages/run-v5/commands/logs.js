'use strict'

let cli = require('heroku-cli-util')
let logDisplayer = require('../lib/log_displayer')
const { DynoCompletion, ProcessTypeCompletion } = require('@heroku-cli/command/lib/completions')

async function run (context, heroku) {
  cli.color.enabled = context.flags['force-colors'] || cli.color.enabled
  await logDisplayer(heroku, {
    app: context.app,
    dyno: context.flags.dyno || context.flags.ps,
    lines: context.flags.num || 100,
    tail: context.flags.tail,
    source: context.flags.source
  })
}

module.exports = {
  topic: 'logs',
  description: `display recent log output
disable colors with --no-color, HEROKU_LOGS_COLOR=0, or HEROKU_COLOR=0`,
  examples: `$ heroku logs
2012-01-01T12:00:00+00:00 heroku[api]: Config add EXAMPLE by email@example.com
2012-01-01T12:00:01+00:00 heroku[api]: Release v1 created by email@example.com`,
  needsAuth: true,
  needsApp: true,
  flags: [
    { name: 'num', char: 'n', description: 'number of lines to display', hasValue: true },
    { name: 'ps', char: 'p', description: 'hidden alias for dyno', hasValue: true, hidden: true },
    { name: 'dyno', char: 'd', description: 'only show output from this dyno type (such as "web" or "worker")', hasValue: true, completion: DynoCompletion },
    { name: 'source', char: 's', description: 'only show output from this source (such as "app" or "heroku")', hasValue: true, completion: ProcessTypeCompletion },
    { name: 'tail', char: 't', description: 'continually stream logs' },
    { name: 'force-colors', description: 'force use of colors (even on non-tty output)' }
  ],
  run: cli.command(run)
}
