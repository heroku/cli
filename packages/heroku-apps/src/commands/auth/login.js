const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  try {
    yield cli.login({save: true, sso: context.flags.sso, expires_in: context.flags['expires-in'], browser: context.flags.browser})
  } catch (err) {
    if (err.statusCode === 401) return yield run(context, heroku)
    throw err
  }
  yield cli.command(co.wrap(function * (context, heroku) {
    let account = yield heroku.get('/account')
    cli.log(`Logged in as ${account.email}`)
  }))(context)
}

module.exports = {
  topic: 'auth',
  command: 'login',
  description: 'login with your Heroku credentials',
  aliases: ['login'],
  flags: [
    {name: 'browser', description: 'browser to open SSO with'},
    {name: 'sso', description: 'login for enterprise users under SSO'},
    {name: 'expires-in', char: 'e', description: 'duration of token in seconds (default 1 year)', hasValue: true}
  ],
  run: cli.command(co.wrap(run))
}
