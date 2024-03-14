'use strict'

const flatten = require('lodash.flatten')

exports.topics = [
  {name: 'access', description: 'manage user access to apps'},
  {name: 'orgs', description: 'manage teams'},
  {name: 'members', description: 'manage team members'},
  {name: 'teams', description: 'manage teams'},
  {name: 'sharing', hidden: true},
  {name: 'join', hidden: true},
  {name: 'leave', hidden: true},
  {name: 'lock', hidden: true},
  {name: 'unlock', hidden: true},
]

exports.commands = flatten([
  require('./commands/apps/transfer'),
])
