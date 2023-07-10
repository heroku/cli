export default class {
    version: any;
    getToken: () => any;
    constructor(version: any, getToken: () => any);
    request(url: string, options?: any): Promise<any>;
    getAccount(): Promise<any>;
    createPipelineRepository(pipeline: any, repository: any): Promise<any>;
    updatePipelineRepository(pipeline: any, body: any): Promise<any>;
    updateAppLink(app: any, body: any): Promise<any>;
    getAppLink(app: any): Promise<any>;
    getPipelineRepository(pipeline: any): Promise<any>;
    getPipelineGithub(pipeline: any): Promise<any>;
    getArchiveURL(repo: any, ref: any): Promise<any>;
}
