"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_call_1 = require("http-call");
const KOLKRABBI_BASE_URL = 'https://kolkrabbi.heroku.com';
class default_1 {
    constructor(version, getToken) {
        this.version = version;
        this.getToken = getToken;
    }
    request(url, options = {}) {
        options.headers = {
            Authorization: `Bearer ${this.getToken()}`,
            'User-Agent': this.version,
        };
        if (['POST', 'PATCH', 'DELETE'].includes(options.method)) {
            options.headers['Content-type'] = 'application/json';
        }
        return http_call_1.HTTP.request(KOLKRABBI_BASE_URL + url, options).then((res) => res.body);
    }
    getAccount() {
        return this.request('/account/github/token');
    }
    createPipelineRepository(pipeline, repository) {
        return this.request(`/pipelines/${pipeline}/repository`, {
            method: 'POST',
            body: { repository },
        });
    }
    updatePipelineRepository(pipeline, body) {
        return this.request(`/pipelines/${pipeline}/repository`, {
            method: 'PATCH',
            body,
        });
    }
    updateAppLink(app, body) {
        return this.request(`/apps/${app}/github`, {
            method: 'PATCH',
            body,
        });
    }
    getAppLink(app) {
        return this.request(`/apps/${app}/github`, {
            method: 'GET',
        });
    }
    getPipelineRepository(pipeline) {
        return this.request(`/pipelines/${pipeline}/repository`, {
            method: 'GET',
        });
    }
    getPipelineGithub(pipeline) {
        return this.request(`/pipelines/${pipeline}/github`, {
            method: 'GET',
        });
    }
    getArchiveURL(repo, ref) {
        return this.request(`/github/repos/${repo}/tarball/${ref}`, {
            followRedirect: false,
        }).then(res => res.archive_link);
    }
}
exports.default = default_1;
