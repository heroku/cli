'use strict'

const nock = require('nock')

function apps() {
  return nock('https://api.heroku.com:443')
    .get('/apps')
    .reply(200, [
      {name: 'my-team-app', owner: {email: 'team@herokumanager.com'}},
      {name: 'myapp', owner: {email: 'foo@foo.com'}},
    ])
}

function teams(teams = [
  {name: 'enterprise a', role: 'collaborator', type: 'enterprise'},
  {name: 'team a', role: 'collaborator', type: 'team'},
  {name: 'enterprise b', role: 'admin', type: 'enterprise'},
  {name: 'team b', role: 'admin', type: 'team'},
]) {
  return nock('https://api.heroku.com:443')
    .get('/teams')
    .reply(200, teams)
}

function teamApp(locked = false) {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp')
    .reply(200, {
      name: 'myapp',
      owner: {email: 'myteam@herokumanager.com'},
      locked: locked,
    })
}

function teamFeatures(features) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .get('/teams/myteam/features')
    .reply(200, features)
}

function teamInfo(type = 'enterprise') {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .get('/teams/myteam')
    .reply(200, {
      name: 'myteam',
      role: 'admin',
      type: type,
    })
}

function teamInvites(invites = [
  {
    invited_by: {email: 'raulb@heroku.com'},
    role: 'admin',
    user: {email: 'invited-user@mail.com'},
  },
]) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.team-invitations'},
  })
    .get('/teams/myteam/invitations')
    .reply(200, invites)
}

function personalApp() {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp')
    .reply(200, {
      name: 'myapp',
      owner: {email: 'raulb@heroku.com'},
    })
}

function userAccount(email = 'raulb@heroku.com') {
  return nock('https://api.heroku.com:443')
    .get('/account')
    .reply(200, {email})
}

module.exports = {
  apps,
  personalApp,
  teamApp,
  teamFeatures,
  teamInfo,
  teamInvites,
  teams,
  userAccount,
}
