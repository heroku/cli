"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const assert_1 = tslib_1.__importDefault(require("assert"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const stream_1 = tslib_1.__importDefault(require("stream"));
const util_1 = tslib_1.__importDefault(require("util"));
const api_1 = require("../../api");
const key_by_1 = tslib_1.__importDefault(require("../../key-by"));
const cli = core_1.CliUx.ux;
const sleep = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
};
exports.sleep = sleep;
function assertNotPromotingToSelf(source, target) {
    assert_1.default.notStrictEqual(source, target, `Cannot promote from an app to itself: ${target}. Specify a different target app.`);
}
function findAppInPipeline(apps, target) {
    const found = apps.find(app => (app.name === target) || (app.id === target));
    (0, assert_1.default)(found, `Cannot find app ${color_1.default.app(target)}`);
    return found;
}
const PROMOTION_ORDER = ['development', 'staging', 'production'];
const wait = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));
function isComplete(promotionTarget) {
    return promotionTarget.status !== 'pending';
}
function isSucceeded(promotionTarget) {
    return promotionTarget.status === 'succeeded';
}
function isFailed(promotionTarget) {
    return promotionTarget.status === 'failed';
}
function pollPromotionStatus(heroku, id, needsReleaseCommand) {
    return heroku.get(`/pipeline-promotions/${id}/promotion-targets`).then(function ({ body: targets }) {
        if (targets.every(isComplete)) { // eslint-disable-line unicorn/no-array-callback-reference
            return targets;
        }
        //
        // With only one target, we can return as soon as the release is created.
        // The command will then read the release phase output
        //
        // `needsReleaseCommand` allows us to keep polling, as it can take a few
        // seconds to get the release to succeeded after the release command
        // finished.
        //
        if (needsReleaseCommand && targets.length === 1 && targets[0].release !== null) {
            return targets;
        }
        return wait(1000).then(pollPromotionStatus.bind(null, heroku, id, needsReleaseCommand));
    });
}
async function getCoupling(heroku, app) {
    cli.log('Fetching app info...');
    const { body: coupling } = await heroku.get(`/apps/${app}/pipeline-couplings`);
    return coupling;
}
async function promote(heroku, label, id, sourceAppId, targetApps, secondFactor) {
    const options = {
        headers: {},
        body: {
            pipeline: { id },
            source: { app: { id: sourceAppId } },
            targets: targetApps.map(app => ({ app: { id: app.id } })),
        },
    };
    if (secondFactor) {
        options.headers = { 'Heroku-Two-Factor-Code': secondFactor };
    }
    try {
        cli.log(`${label}...`);
        const { body: promotions } = await heroku.post('/pipeline-promotions', options);
        return promotions;
    }
    catch (error) {
        if (!error.body || error.body.id !== 'two_factor') {
            throw error;
        }
        const secondFactor = await heroku.twoFactorPrompt();
        return promote(heroku, label, id, sourceAppId, targetApps, secondFactor);
    }
}
function assertValidPromotion(app, source, target) {
    if (!target || PROMOTION_ORDER.indexOf(source) < 0) { // eslint-disable-line unicorn/prefer-includes
        throw new Error(`Cannot promote ${app} from '${source}' stage`);
    }
}
function assertApps(app, targetApps, targetStage) {
    if (targetApps.length === 0) {
        throw new Error(`Cannot promote from ${color_1.default.app(app)} as there are no downstream apps in ${targetStage} stage`);
    }
}
async function getRelease(heroku, app, releaseId) {
    cli.log('Fetching release info...');
    const { body: release } = await heroku.get(`/apps/${app}/releases/${releaseId}`);
    return release;
}
async function streamReleaseCommand(heroku, targets, promotion) {
    if (targets.length !== 1 || targets.every(isComplete)) { // eslint-disable-line unicorn/no-array-callback-reference
        return pollPromotionStatus(heroku, promotion.id, false);
    }
    const target = targets[0];
    const release = await getRelease(heroku, target.app.id, target.release.id);
    if (!release.output_stream_url) {
        return pollPromotionStatus(heroku, promotion.id, false);
    }
    cli.log('Running release command...');
    async function streamReleaseOutput(releaseStreamUrl) {
        const finished = util_1.default.promisify(stream_1.default.finished);
        const fetchResponse = await (0, node_fetch_1.default)(releaseStreamUrl);
        if (fetchResponse.status >= 400) {
            throw new Error('stream release output not available');
        }
        fetchResponse.body.pipe(process.stdout);
        await finished(fetchResponse.body);
    }
    async function retry(maxAttempts, fn) {
        let currentAttempt = 0;
        while (true) {
            try {
                await fn();
                return;
            }
            catch (error) {
                if (++currentAttempt === maxAttempts) {
                    throw error;
                }
                await (0, exports.sleep)(1000);
            }
        }
    }
    await retry(100, () => {
        return streamReleaseOutput(release.output_stream_url);
    });
    return pollPromotionStatus(heroku, promotion.id, false);
}
class Promote extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Promote);
        const appNameOrId = flags.app;
        const coupling = await getCoupling(this.heroku, appNameOrId);
        cli.log(`Fetching apps from ${color_1.default.pipeline(coupling.pipeline.name)}...`);
        const allApps = await (0, api_1.listPipelineApps)(this.heroku, coupling.pipeline.id);
        const sourceStage = coupling.stage;
        let promotionActionName = '';
        let targetApps = [];
        if (flags.to) {
            // The user specified a specific set of apps they want to target
            // We don't have to infer the apps or the stage they want to promote to
            // Strip out any empty app names due to something like a trailing comma
            const targetAppNames = flags.to.split(',').filter(appName => appName.length > 0);
            // Now let's make sure that we can find every target app they specified
            // The only requirement is that the app be in this pipeline. They can be at any stage.
            targetApps = targetAppNames.reduce((acc, targetAppNameOrId) => {
                assertNotPromotingToSelf(appNameOrId, targetAppNameOrId);
                const app = findAppInPipeline(allApps, targetAppNameOrId);
                if (app) {
                    acc.push(app);
                }
                return acc;
            }, []);
            promotionActionName = `Starting promotion to apps: ${targetAppNames.toString()}`;
        }
        else {
            const targetStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage) + 1];
            assertValidPromotion(appNameOrId, sourceStage, targetStage);
            targetApps = allApps.filter(app => app.coupling.stage === targetStage);
            assertApps(appNameOrId, targetApps, targetStage);
            promotionActionName = `Starting promotion to ${targetStage}`;
        }
        const promotion = await promote(this.heroku, promotionActionName, coupling.pipeline.id, coupling.app.id, targetApps);
        const pollLoop = pollPromotionStatus(this.heroku, promotion.id, true);
        cli.log('Waiting for promotion to complete...');
        let promotionTargets = await pollLoop;
        try {
            promotionTargets = await streamReleaseCommand(this.heroku, promotionTargets, promotion);
        }
        catch (error) {
            cli.error(error);
        }
        const appsByID = (0, key_by_1.default)(allApps, 'id');
        const styledTargets = promotionTargets.reduce(function (memo, target) {
            const app = appsByID[target.app.id];
            const details = [target.status];
            if (isFailed(target)) {
                details.push(target.error_message);
            }
            memo[app.name] = details;
            return memo;
        }, {});
        if (promotionTargets.every(isSucceeded)) { // eslint-disable-line unicorn/no-array-callback-reference
            cli.log('\nPromotion successful');
        }
        else {
            cli.warn('\nPromotion to some apps failed');
        }
        cli.styledObject(styledTargets);
    }
}
exports.default = Promote;
Promote.description = 'promote the latest release of this app to its downstream app(s)';
Promote.examples = [
    '$ heroku pipelines:promote -a my-app-staging',
];
Promote.flags = {
    app: command_1.flags.app({
        required: true,
    }),
    remote: command_1.flags.remote(),
    to: command_1.flags.string({
        char: 't',
        description: 'comma separated list of apps to promote to',
    }),
};
