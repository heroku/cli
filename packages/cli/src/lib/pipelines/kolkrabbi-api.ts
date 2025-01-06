import {HTTP} from '@heroku/http-call'

const KOLKRABBI_BASE_URL = 'https://kolkrabbi.heroku.com'

export default class {
  version: any

  getToken: () => any

  constructor(version: any, getToken: () => any) {
    this.version = version
    this.getToken = getToken
  }

  request(url: string, options: any = {}) {
    options.headers = {
      Authorization: `Bearer ${this.getToken()}`,
      'User-Agent': this.version,
    }

    if (['POST', 'PATCH', 'DELETE'].includes(options.method)) {
      options.headers['Content-type'] = 'application/json'
    }

    return HTTP.request(KOLKRABBI_BASE_URL + url, options).then((res: any) => res.body)
  }

  getAccount() {
    return this.request('/account/github/token')
  }

  createPipelineRepository(pipeline: any, repository: any) {
    return this.request(`/pipelines/${pipeline}/repository`, {
      method: 'POST',
      body: {repository},
    })
  }

  updatePipelineRepository(pipeline: any, body: any) {
    return this.request(`/pipelines/${pipeline}/repository`, {
      method: 'PATCH',
      body,
    })
  }

  updateAppLink(app: any, body: any) {
    return this.request(`/apps/${app}/github`, {
      method: 'PATCH',
      body,
    })
  }

  getAppLink(app: any) {
    return this.request(`/apps/${app}/github`, {
      method: 'GET',
    })
  }

  getPipelineRepository(pipeline: any) {
    return this.request(`/pipelines/${pipeline}/repository`, {
      method: 'GET',
    })
  }

  getPipelineGithub(pipeline: any) {
    return this.request(`/pipelines/${pipeline}/github`, {
      method: 'GET',
    })
  }

  getArchiveURL(repo: any, ref: any) {
    return this.request(`/github/repos/${repo}/tarball/${ref}`, {
      followRedirect: false,
    }).then(res => res.archive_link)
  }
}
