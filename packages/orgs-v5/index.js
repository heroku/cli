'use strict'

const flatten = require('lodash.flatten')

exports.topics = [
  { name: 'access', description: 'manage user access to apps' },
  { name: 'orgs', description: 'manage organizations' },
  { name: 'members', description: 'manage organization members' },
  { name: 'teams', description: 'manage teams' },
  { name: 'sharing', hidden: true },
  { name: 'join', hidden: true },
  { name: 'leave', hidden: true },
  { name: 'lock', hidden: true },
  { name: 'unlock', hidden: true }
]

exports.commands = flatten([
  require('./commands/access'),
  require('./commands/access/add'),
  require('./commands/access/remove'),
  require('./commands/access/update'),
  require('./commands/apps/join'),
  require('./commands/apps/leave'),
  require('./commands/apps/lock'),
  require('./commands/apps/transfer'),
  require('./commands/apps/unlock'),
  require('./commands/members'),
  require('./commands/members/add'),
  require('./commands/members/set'),
  require('./commands/members/remove'),
  require('./commands/orgs'),
  require('./commands/orgs/default'),
  require('./commands/orgs/open'),
  require('./commands/teams')
])
