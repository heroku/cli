function mockSniFeatureFlag (nock, appName, enabled = false) {
  return nock('https://api.heroku.com')
    .get(`/apps/${appName}/features`)
    .reply(200, [
      {
        name: 'allow-multiple-sni-endpoints',
        enabled
      }
    ])
}

module.exports = mockSniFeatureFlag
