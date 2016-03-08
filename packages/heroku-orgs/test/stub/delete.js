function collaboratorsOrgApp(app, email) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
  })
  .delete(`/organizations/apps/${app}/collaborators/${email}`).reply(200, {});
}

function collaboratorsPersonalApp(app, email) {
  return nock('https://api.heroku.com:443', {})
  .delete(`/apps/${app}/collaborators/${email}`).reply(200, {});
}

module.exports = {
  collaboratorsOrgApp: collaboratorsOrgApp,
  collaboratorsPersonalApp: collaboratorsPersonalApp,
};
