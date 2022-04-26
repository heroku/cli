function mockSniFeatureFlag (nock, appName, multiSniEnabled = false, isPrivateSpaceApp = false) {
  return nock('https://api.heroku.com')
    .get(`/apps/${appName}/features`)
    .reply(200, [
      {
        name: 'allow-multiple-sni-endpoints',
        enabled: multiSniEnabled
      }
    ])
    .get(`/apps/${appName}`)
    .reply(200, {
      space: isPrivateSpaceApp ? {} : null
    })
}

module.exports = mockSniFeatureFlag
