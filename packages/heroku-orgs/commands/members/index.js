'use strict'

let _ = require('lodash')
let cli = require('heroku-cli-util')
let co = require('co')
let Utils = require('../../lib/utils')

function * run (context, heroku) {
  let orgInfo = yield Utils.orgInfo(context, heroku)
  let groupName = context.org || context.flags.team
  let teamInvites = []

  if (orgInfo.type === 'team') {
    let orgFeatures = yield heroku.get(`/organizations/${groupName}/features`)

    if (orgFeatures.find(feature => feature.name === 'team-invite-acceptance' && feature.enabled)) {
      teamInvites = yield heroku.request({
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.team-invitations'
        },
        method: 'GET',
        path: `/organizations/${groupName}/invitations`
      })
      teamInvites = _.map(teamInvites, function (invite) {
        return {email: invite.user.email, role: invite.role, status: 'pending'}
      })
    }
  }

  let members = yield heroku.get(`/organizations/${groupName}/members`)
  // Set status '' to all existing members
  _.map(members, (member) => { member.status = '' })
  members = _.sortBy(_.union(members, teamInvites), 'email')
  if (context.flags.role) members = members.filter(m => m.role === context.flags.role)
  if (context.flags.pending) members = members.filter(m => m.status === 'pending')
  if (context.flags.json) {
    cli.log(JSON.stringify(members, null, 3))
  } else if (members.length === 0) {
    let msg = `No members in ${cli.color.magenta(groupName)}`
    if (context.flags.role) msg += ` with role ${cli.color.green(context.flags.role)}`
    cli.log(msg)
  } else {
    cli.table(members, {
      printHeader: false,
      columns: [
        {key: 'email', label: 'Email', format: e => cli.color.cyan(e)},
        {key: 'role', label: 'Role', format: r => cli.color.green(r)},
        {key: 'status', label: 'Status', format: r => cli.color.green(r)}
      ]
    })
  }

  Utils.warnUsingOrgFlagInTeams(orgInfo, context)
}

module.exports = {
  topic: 'members',
  description: 'list members of an organization or a team',
  needsAuth: true,
  wantsOrg: true,
  flags: [
    {name: 'role', char: 'r', hasValue: true, description: 'filter by role'},
    {name: 'pending', hasValue: false, description: 'filter by pending team invitations'},
    {name: 'team', char: 't', hasValue: true, description: 'team to use'},
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
