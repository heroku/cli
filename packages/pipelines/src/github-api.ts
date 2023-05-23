import HTTP from 'http-call'
const GITHUB_API = 'https://api.github.com'

export default class GitHubAPI {
  version: any

  token: any

  constructor(version: any, token: any) {
    this.version = version
    this.token = token
  }

  request(url: any, options: any = {}) {
    options.headers = {
      Authorization: `Token ${this.token}`,
      'User-Agent': this.version,
      ...options.headers,
    }

    return HTTP.get(`${GITHUB_API}${url}`, options)
  }

  getRepo(name: any) {
    return this.request(`/repos/${name}`).then((res: any) => res.body)
  }
}
