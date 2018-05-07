let cli = require('heroku-cli-util')
let co = require('co')

let run = function(fn) {
  return cli.command(co.wrap(function * (context, heroku) {
    heroku.options.headers['accept'] = 'application/vnd.heroku+json; version=3.enterprise-accounts'
    yield fn(context, heroku)
  }))
}

let run_admin = function(fn) {
  return cli.command(co.wrap(function * (context, heroku) {
    heroku.options.headers['accept'] = 'application/json'
    yield fn(context, heroku)
  }))
}

module.exports = {
  run,
  run_admin
}
