'use strict'

module.exports = function (heroku) {
  function getLogDrain(space) {
    return heroku.request({
      path: `/spaces/${space}/log-drain`,
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    })
  }

  return {
    getLogDrain,
  }
}
