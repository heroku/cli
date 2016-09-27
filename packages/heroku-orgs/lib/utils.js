let error = require('./error')

var isOrgApp = function (owner) {
  return (/@herokumanager\.com$/.test(owner))
}

var isValidEmail = function (email) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
}

var orgInfo = function * (context, heroku) {
  let teamOrOrgName = context.org || context.flags.team
  if (!teamOrOrgName) {
    error.exit(1, 'No team or org specified.\nRun this command with --team or --org')
  }
  return yield heroku.get(`/organizations/${context.org || context.flags.team}`)
}

var getOwner = function (owner) {
  if (isOrgApp(owner)) {
    return owner.split('@herokumanager.com')[0]
  }
  return owner
}

module.exports = {
  getOwner,
  isOrgApp,
  isValidEmail,
  orgInfo
}
