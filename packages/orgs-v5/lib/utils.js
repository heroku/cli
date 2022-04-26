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

let printGroups = function (group, type = {label: 'Team'}) {
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

let teamInfo = async function (context, heroku) {
  let teamName = context.flags.team
  if (!teamName) error.exit(1, 'No team or org specified.\nRun this command with --team')
  return await heroku.get(`/teams/${teamName}`);
}

let addMemberToTeam = async function (email, role, groupName, heroku, method = 'PUT') {
  let request = heroku.request({
    method: method,
    path: `/teams/${groupName}/members`,
    body: {email, role}
  })
  await cli.action(`Adding ${cli.color.cyan(email)} to ${cli.color.magenta(groupName)} as ${cli.color.green(role)}`, request)
}

let warnIfAtTeamMemberLimit = async function (teamInfo, groupName, context, heroku) {
  // Users receive `You'll be billed monthly for teams over 5 members.`
  const FREE_TEAM_LIMIT = 6

  if (teamInfo.type === 'team') {
    let membersAndInvites = {
      invites: await heroku.request({
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.team-invitations'
        },
        method: 'GET',
        path: `/teams/${groupName}/invitations`
      }),
      members: await heroku.get(`/teams/${groupName}/members`)
    }
    const membersCount = membersAndInvites.invites.length + membersAndInvites.members.length
    if (membersCount === FREE_TEAM_LIMIT) cli.warn("You'll be billed monthly for teams over 5 members.")
  }
}

module.exports = {
  addMemberToTeam,
  getOwner,
  isteamApp,
  isValidEmail,
  teamInfo,
  printGroups,
  printGroupsJSON,
  warnIfAtTeamMemberLimit
}
