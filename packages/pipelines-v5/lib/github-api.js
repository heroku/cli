const {HTTP} = require('http-call')
const GITHUB_API = 'https://api.github.com'

module.exports = class GitHubAPI {
  constructor (version, token) {
    this.version = version
    this.token = token
  }

  request (url, options = {}) {
    options.headers = Object.assign({
      Authorization: `Token ${this.token}`,
      'User-Agent': this.version
    }, options.headers)

    return HTTP.get(`${GITHUB_API}${url}`, options)
  }

  getRepo (name) {
    return this.request(`/repos/${name}`).then((res) => res.body)
  }
}
