function appCollaborators() {
  return nock('https://api.heroku.com:443')
  .get('/apps/myapp/collaborators')
  .reply(200, [
    {user: {email: 'raulb@heroku.com'}, role: 'owner'},
    {user: {email: 'jeff@heroku.com'},  role: 'collaborator'},
  ]);
}

function appPrivileges() {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
  })
  .get('/organizations/privileges')
  .reply(200, [
    { name: 'deploy' },
    { name: 'manage' },
    { name: 'operate' },
    { name: 'view' }
  ]);
}

function orgApp() {
  return nock('https://api.heroku.com:443')
  .get('/apps/myapp')
  .reply(200, {
    name: 'myapp',
    owner: { email: 'myorg@herokumanager.com' }
  });
}

function orgAppCollaborators() {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
  })
  .get('/organizations/apps/myapp/collaborators')
  .reply(200, [
    {
      role: 'owner',
      user: { email: 'myorg@herokumanager.com' }
    },
    {
      role: 'collaborator',
      user: { email: 'bob@heroku.com' }
    },
    {
      role: 'admin',
      user: { email: 'raulb@heroku.com' }
    }
  ]);
}

function orgAppCollaboratorsWithPrivileges() {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
  })
  .get('/organizations/apps/myapp/collaborators')
  .reply(200, [
    { privileges: [],
      role: 'owner',
      user: { email: 'myorg@herokumanager.com' }
    },
    {
      privileges: [ { name: 'deploy' }, { name: 'view' } ],
      role: 'viewer',
      user: { email: 'bob@heroku.com' }
    }
  ]);
}

function orgFlags(flags) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=2'}
  })
  .get('/v1/organization/myorg')
  .reply(200, {
    flags: flags,
  });
}

function orgMembers() {
  return nock('https://api.heroku.com:443')
  .get('/organizations/myorg/members')
  .reply(200, [
      {
        email: 'raulb@heroku.com', role: 'admin',
        user: { email: 'raulb@heroku.com' }
      },
      {
        email: 'bob@heroku.com', role: 'viewer',
        user: { email: 'bob@heroku.com' }
      },
      {
        email: 'peter@heroku.com', role: 'collaborator',
        user: { email: 'peter@heroku.com' }
      }
  ]);
}

function personalApp() {
  return nock('https://api.heroku.com:443')
  .get('/apps/myapp')
  .reply(200, {
    name: 'myapp',
    owner: { email: 'raulb@heroku.com' }
  });
}

module.exports = {
  appCollaborators: appCollaborators,
  appPrivileges: appPrivileges,
  orgApp: orgApp,
  orgAppCollaborators: orgAppCollaborators,
  orgAppCollaboratorsWithPrivileges: orgAppCollaboratorsWithPrivileges,
  orgFlags: orgFlags,
  orgMembers: orgMembers,
  personalApp: personalApp
};
