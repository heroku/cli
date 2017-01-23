const cli = require('heroku-cli-util')
const KOLKRABBI_BASE_URL = 'https://kolkrabbi.heroku.com'

module.exports = class KolkrabbiAPI {
  constructor (version, token) {
    this.version = version
    this.token = token
  }

  request (url, options = {}) {
    if (options.body) {
      options.body = JSON.stringify(options.body)
    }

    options.headers = Object.assign({
      Authorization: `Bearer ${this.token}`,
      'User-Agent': this.version
    })

    if (['POST', 'PATCH', 'DELETE'].includes(options.method)) {
      options.headers['Content-type'] = 'application/json'
    }

    options.json = true

    return cli.got(KOLKRABBI_BASE_URL + url, options).then((res) => res.body)
  }

  getAccount () {
    return this.request('/account/github/token')
  }

  createPipelineRepository (pipeline, repository) {
    return this.request(`/pipelines/${pipeline}/repository`, {
      method: 'POST',
      body: { repository }
    })
  }

  updatePipelineRepository (pipeline, body) {
    return this.request(`/pipelines/${pipeline}/repository`, {
      method: 'PATCH',
      body
    })
  }

  updateAppLink (app, body) {
    return this.request(`/apps/${app}/github`, {
      method: 'PATCH',
      body
    })
  }
}
