"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http_call_1 = tslib_1.__importDefault(require("http-call"));
const GITHUB_API = 'https://api.github.com';
class GitHubAPI {
    constructor(version, token) {
        this.version = version;
        this.token = token;
    }
    request(url, options = {}) {
        options.headers = Object.assign({ Authorization: `Token ${this.token}`, 'User-Agent': this.version }, options.headers);
        return http_call_1.default.get(`${GITHUB_API}${url}`, options);
    }
    getRepo(name) {
        return this.request(`/repos/${name}`).then((res) => res.body);
    }
}
exports.default = GitHubAPI;
