let _ = require('lodash')
let cli = require('heroku-cli-util')
let error = require('./error')

let getOwner = function (owner) {
  if (isteamApp(owner)) {
    return owner.split('@herokumanager.com')[0]
  }

  return owner
}

let isteamApp = function (owner) {
  return (/@herokumanager\.com$/.test(owner))
}

let isValidEmail = function (email) {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
}

// eslint-disable-next-line unicorn/no-object-as-default-parameter
let printGroups = function (group, type = {label: 'Team'}) {
  group = _.sortBy(group, 'name')
  cli.table(group, {
    columns: [
      {key: 'name', label: type.label, format: o => cli.color.green(o)},
      {key: 'role', label: 'Role', format: r => r},
    ],
    printHeader: false,
  })
}

let printGroupsJSON = function (group) {
  cli.log(JSON.stringify(group, null, 2))
}

let teamInfo = async function (context, heroku) {
  let teamName = context.flags.team
  if (!teamName) error.exit(1, 'No team or org specified.\nRun this command with --team')
  return await heroku.get(`/teams/${teamName}`)
}

let addMemberToTeam = async function (email, role, groupName, heroku, method = 'PUT') {
  let request = heroku.request({
    method: method,
    path: `/teams/${groupName}/members`,
    body: {email, role},
  })
  await cli.action(`Adding ${cli.color.cyan(email)} to ${cli.color.magenta(groupName)} as ${cli.color.green(role)}`, request)
}

module.exports = {
  addMemberToTeam,
  getOwner,
  isteamApp,
  isValidEmail,
  teamInfo,
  printGroups,
  printGroupsJSON,
}
