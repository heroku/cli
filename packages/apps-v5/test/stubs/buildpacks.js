'use strict'

let nock = require('nock')

function get() {
  return nock('https://api.heroku.com')
    .get('/apps/example/buildpack-installations')
    .reply(200, Array.prototype.map.call(arguments, function (bp, i) {
      return {buildpack: {url: bp}, ordinal: i}
    }))
}

function put() {
  return nock('https://api.heroku.com')
    .put('/apps/example/buildpack-installations', {
      updates: Array.prototype.map.call(arguments, function (bp) {
        return {buildpack: bp}
      }),
    })
    .reply(200, Array.prototype.map.call(arguments, function (bp, i) {
      return {buildpack: {url: bp}, ordinal: i}
    }))
}

module.exports = {
  get: get,
  put: put,
}
