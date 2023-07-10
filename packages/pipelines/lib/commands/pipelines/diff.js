"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const http_call_1 = tslib_1.__importDefault(require("http-call"));
const api_1 = require("../../api");
const kolkrabbi_api_1 = tslib_1.__importDefault(require("../../kolkrabbi-api"));
const cli = core_1.CliUx.ux;
const PROMOTION_ORDER = ['development', 'staging', 'production'];
async function diff(targetApp, downstreamApp, githubToken, herokuUserAgent) {
    if (!downstreamApp.repo) {
        return cli.log(`\n${color_1.default.app(targetApp.name)} was not compared to ${color_1.default.app(downstreamApp.name)} as ${color_1.default.app(downstreamApp.name)} is not connected to GitHub`);
    }
    if (downstreamApp.repo !== targetApp.repo) {
        return cli.log(`\n${color_1.default.app(targetApp.name)} was not compared to ${color_1.default.app(downstreamApp.name)} as ${color_1.default.app(downstreamApp.name)} is not connected to the same GitHub repo as ${color_1.default.app(targetApp.name)}`);
    }
    if (!downstreamApp.hash) {
        return cli.log(`\n${color_1.default.app(targetApp.name)} was not compared to ${color_1.default.app(downstreamApp.name)} as ${color_1.default.app(downstreamApp.name)} does not have any releases`);
    }
    if (downstreamApp.hash === targetApp.hash) {
        return cli.log(`\n${color_1.default.app(targetApp.name)} is up to date with ${color_1.default.app(downstreamApp.name)}`);
    }
    // Do the actual Github diff
    try {
        const path = `${targetApp.repo}/compare/${downstreamApp.hash}...${targetApp.hash}`;
        const headers = { authorization: 'token ' + githubToken };
        if (herokuUserAgent) {
            headers['user-agent'] = herokuUserAgent;
        }
        const githubDiff = await http_call_1.default.get(`https://api.github.com/repos/${path}`, {
            headers,
        }).then(res => res.body);
        cli.log('');
        cli.styledHeader(`${color_1.default.app(targetApp.name)} is ahead of ${color_1.default.app(downstreamApp.name)} by ${githubDiff.ahead_by} commit${githubDiff.ahead_by === 1 ? '' : 's'}`);
        const mapped = githubDiff.commits.map((commit) => {
            return {
                sha: commit.sha.slice(0, 7),
                date: commit.commit.author.date,
                author: commit.commit.author.name,
                message: commit.commit.message.split('\n')[0],
            };
        }).reverse();
        cli.table(mapped, {
            sha: {
                header: 'SHA',
            },
            date: {},
            author: {},
            message: {},
        });
        cli.log(`\nhttps://github.com/${path}`);
        // tslint:disable-next-line: no-unused
    }
    catch (_a) {
        cli.log(`\n${color_1.default.app(targetApp.name)} was not compared to ${color_1.default.app(downstreamApp.name)} because we were unable to perform a diff`);
        cli.log('are you sure you have pushed your latest commits to GitHub?');
    }
}
class PipelinesDiff extends command_1.Command {
    constructor() {
        super(...arguments);
        this.kolkrabbi = new kolkrabbi_api_1.default(this.config.userAgent, () => this.heroku.auth);
        this.getAppInfo = async (appName, appId) => {
            // Find GitHub connection for the app
            const githubApp = await this.kolkrabbi.getAppLink(appId)
                .catch(() => {
                return { name: appName, repo: null, hash: null };
            });
            // Find the commit hash of the latest release for this app
            let slug;
            try {
                const { body: releases } = await (0, api_1.getReleases)(this.heroku, appId);
                const release = releases.find(r => r.status === 'succeeded');
                if (!release || !release.slug) {
                    throw new Error(`no release found for ${appName}`);
                }
                slug = await this.heroku.get(`/apps/${appId}/slugs/${release.slug.id}`, {
                    headers: { Accept: api_1.V3_HEADER },
                }).then(res => res.body);
                // tslint:disable-next-line: no-unused
            }
            catch (_a) {
                return { name: appName, repo: githubApp.repo, hash: undefined };
            }
            return { name: appName, repo: githubApp.repo, hash: slug.commit };
        };
    }
    async run() {
        const { flags } = await this.parse(PipelinesDiff);
        const targetAppName = flags.app;
        const coupling = await (0, api_1.getCoupling)(this.heroku, targetAppName)
            .then(res => res.body)
            .catch(() => { });
        if (!coupling) {
            cli.error(`This app (${targetAppName}) does not seem to be a part of any pipeline`);
            return;
        }
        const targetAppId = coupling.app.id;
        cli.action.start('Fetching apps from pipeline');
        const allApps = await (0, api_1.listPipelineApps)(this.heroku, coupling.pipeline.id);
        cli.action.stop();
        const sourceStage = coupling.stage;
        if (!sourceStage) {
            return cli.error(`Unable to diff ${targetAppName}`);
        }
        const downstreamStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage) + 1];
        if (!downstreamStage || PROMOTION_ORDER.indexOf(sourceStage) < 0) { // eslint-disable-line unicorn/prefer-includes
            return cli.error(`Unable to diff ${targetAppName}`);
        }
        const downstreamApps = allApps.filter(function (app) {
            return app.coupling.stage === downstreamStage;
        });
        if (downstreamApps.length === 0) {
            return cli.error(`Cannot diff ${targetAppName} as there are no downstream apps configured`);
        }
        // Fetch GitHub repo/latest release hash for [target, downstream[0], .., downstream[n]] apps
        const appInfoPromises = [this.getAppInfo(targetAppName, targetAppId)];
        downstreamApps.forEach(app => {
            if (app.name && app.id) {
                appInfoPromises.push(this.getAppInfo(app.name, app.id));
            }
        });
        cli.action.start('Fetching release info for all apps');
        const appInfo = await Promise.all(appInfoPromises);
        cli.action.stop();
        // Verify the target app
        const targetAppInfo = appInfo[0];
        if (!targetAppInfo.repo) {
            const command = `heroku pipelines:open ${coupling.pipeline.name}`;
            return cli.error(`${targetAppName} does not seem to be connected to GitHub!\nRun ${color_1.default.cyan(command)} and "Connect to GitHub".`);
        }
        if (!targetAppInfo.hash) {
            return cli.error(`No release was found for ${targetAppName}, unable to diff`);
        }
        // Fetch GitHub token for the user
        const githubAccount = await this.kolkrabbi.getAccount();
        // Diff [{target, downstream[0]}, {target, downstream[1]}, .., {target, downstream[n]}]
        const downstreamAppsInfo = appInfo.slice(1);
        for (const downstreamAppInfo of downstreamAppsInfo) {
            await diff(targetAppInfo, downstreamAppInfo, githubAccount.github.token, this.config.userAgent);
        }
    }
}
exports.default = PipelinesDiff;
PipelinesDiff.description = 'compares the latest release of this app to its downstream app(s)';
PipelinesDiff.examples = [
    '$ heroku pipelines:diff -a my-app-staging',
];
PipelinesDiff.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
};
