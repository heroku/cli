const cli = require('heroku-cli-util')
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

    options.json = true

    return cli.got.get(`${GITHUB_API}${url}`, options)
  }

  getRepo (name) {
    return this.request(`/repos/${name}`).then((res) => res.body)
  }

  getArchiveURL (repo, ref) {
    return this.request(`/repos/${repo}/tarball/${ref}`, {
      followRedirect: false
    }).then((res) => res.headers.location)
  }
}
