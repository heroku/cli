import HTTP from 'http-call';
export default class GitHubAPI {
    version: any;
    token: any;
    constructor(version: any, token: any);
    request(url: any, options?: any): Promise<HTTP<unknown>>;
    getRepo(name: any): Promise<any>;
}
