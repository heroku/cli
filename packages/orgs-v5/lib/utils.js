let _ = require('lodash')
let cli = require('heroku-cli-util')
let error = require('./error')

let getOwner = function (owner) {
  if (isOrgApp(owner)) {
    return owner.split('@herokumanager.com')[0]
  }
  return owner
}

let isOrgApp = function (owner) {
  return (/@herokumanager\.com$/.test(owner))
}

let isValidEmail = function (email) {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
}

let printGroups = function (group, type = {label: 'Organization'}) {
  group = _.sortBy(group, 'name')
  cli.table(group, {
    columns: [
      {key: 'name', label: type.label, format: o => cli.color.green(o)},
      {key: 'role', label: 'Role', format: r => r}
    ],
    printHeader: false
  })
}

let printGroupsJSON = function (group) {
  cli.log(JSON.stringify(group, null, 2))
}

let orgInfo = function * (context, heroku) {
  let teamOrOrgName = context.org || context.flags.team
  if (!teamOrOrgName) error.exit(1, 'No team or org specified.\nRun this command with --team or --org')
  return yield heroku.get(`/organizations/${context.org || context.flags.team}`)
}

let warnUsingOrgFlagInTeams = function (orgInfo, context) {
  if ((orgInfo.type === 'team') && (!context.flags.team)) {
    cli.warn(`${cli.color.cmd(context.org)} is a Heroku Team\nHeroku CLI now supports Heroku Teams.\nUse ${cli.color.cmd('-t')} or ${cli.color.cmd('--team')} for teams like ${cli.color.cmd(context.org)}`)
  }
}

let addMemberToOrg = function * (email, role, groupName, heroku, method = 'PUT') {
  let request = heroku.request({
    method: method,
    path: `/organizations/${groupName}/members`,
    body: {email, role}
  })
  yield cli.action(`Adding ${cli.color.cyan(email)} to ${cli.color.magenta(groupName)} as ${cli.color.green(role)}`, request)
}

let warnIfAtTeamMemberLimit = async function (orgInfo, groupName, context, heroku) {
  // Users receive `You'll be billed monthly for teams over 5 members.`
  const FREE_TEAM_LIMIT = 6

  if (orgInfo.type === 'team') {
    let membersAndInvites = {
      invites: await heroku.request({
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.team-invitations'
        },
        method: 'GET',
        path: `/organizations/${groupName}/invitations`
      }),
      members: await heroku.get(`/organizations/${groupName}/members`)
    }
    const membersCount = membersAndInvites.invites.length + membersAndInvites.members.length
    if (membersCount === FREE_TEAM_LIMIT) cli.warn("You'll be billed monthly for teams over 5 members.")
  }
}

module.exports = {
  addMemberToOrg,
  getOwner,
  isOrgApp,
  isValidEmail,
  orgInfo,
  printGroups,
  printGroupsJSON,
  warnIfAtTeamMemberLimit,
  warnUsingOrgFlagInTeams
}
