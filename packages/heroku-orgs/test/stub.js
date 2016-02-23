function orgFlags(flags) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=2'}
  })
  .get('/v1/organization/myorg')
  .reply(200, {
    flags: flags,
  });
}

module.exports.orgFlags = orgFlags;

function postCollaboratorsWithPrivileges(privileges) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
  })
  .post('/organizations/apps/myapp/collaborators', {
    user: 'raulb@heroku.com',
    privileges: privileges || [""]
  }).reply(200);
}

module.exports.postCollaboratorsWithPrivileges = postCollaboratorsWithPrivileges;

function postCollaborators() {
  return nock('https://api.heroku.com:443')
    .post('/apps/myapp/collaborators', {
      user: 'raulb@heroku.com'
    }).reply(200);
}

module.exports.postCollaborators = postCollaborators;

function getOrgApp() {
  return nock('https://api.heroku.com:443')
  .get('/apps/myapp')
  .reply(200, {
    name: 'myapp',
    owner: { email: 'myorg@herokumanager.com' }
  });
}

module.exports.getOrgApp = getOrgApp;

function getPersonalApp() {
  return nock('https://api.heroku.com:443')
  .get('/apps/myapp')
  .reply(200, {
    name: 'myapp',
    owner: { email: 'raulb@heroku.com' }
  });
}

module.exports.getPersonalApp = getPersonalApp;
