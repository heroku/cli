'use strict'

let _ = require('lodash')
let cli = require('heroku-cli-util')
let Utils = require('../../lib/utils')
const { flags } = require('@heroku-cli/command')
const { RoleCompletion } = require('@heroku-cli/command/lib/completions')

async function run(context, heroku) {
  let teamInfo = await Utils.teamInfo(context, heroku)
  let groupName = context.flags.team
  let teamInvites = []

  if (teamInfo.type === 'team') {
    let orgFeatures = await heroku.get(`/teams/${groupName}/features`)

    if (orgFeatures.find(feature => feature.name === 'team-invite-acceptance' && feature.enabled)) {
      teamInvites = await heroku.request({
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.team-invitations'
        },
        method: 'GET',
        path: `/teams/${groupName}/invitations`
      })
      teamInvites = _.map(teamInvites, function (invite) {
        return { email: invite.user.email, role: invite.role, status: 'pending' }
      })
    }
  }

  let members = await heroku.get(`/teams/${groupName}/members`)
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
        { key: 'email', label: 'Email', format: e => cli.color.cyan(e) },
        { key: 'role', label: 'Role', format: r => cli.color.green(r) },
        { key: 'status', label: 'Status', format: r => cli.color.green(r) }
      ]
    })
  }
}

module.exports = {
  topic: 'members',
  description: 'list members of a team',
  needsAuth: true,
  wantsOrg: true,
  flags: [
    { name: 'role', char: 'r', hasValue: true, description: 'filter by role', completion: RoleCompletion },
    { name: 'pending', hasValue: false, description: 'filter by pending team invitations' },
    { name: 'json', description: 'output in json format' },
    flags.team({ name: 'team', hasValue: true, hidden: true })
  ],
  run: cli.command(run)
}
