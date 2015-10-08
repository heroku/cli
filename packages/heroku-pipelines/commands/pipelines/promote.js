'use strict';

const cli = require('heroku-cli-util');
const BBPromise = require('bluebird');

const PROMOTION_ORDER = ["development", "staging", "production"];
const V3_HEADER = 'application/vnd.heroku+json; version=3';
const PIPELINES_HEADER = V3_HEADER + '.pipelines';

function isComplete(promotionTarget) {
  return promotionTarget.status !== 'pending';
}

function isSucceeded(promotionTarget) {
  return promotionTarget.status === 'succeeded';
}

function isFailed(promotionTarget) {
  return promotionTarget.status === 'failed';
}

function pollPromotionStatus(heroku, id) {
  return heroku.request({
    method: 'GET',
    path: `/pipeline-promotions/${id}/promotion-targets`,
    headers: { 'Accept': PIPELINES_HEADER, }
  }).then(function(targets) {
    if (targets.every(isComplete)) { return targets; }

    return BBPromise.delay(1000).then(pollPromotionStatus.bind(null, heroku, id));
  });
}

module.exports = {
  topic: 'pipelines',
  command: 'promote',
  description: "promote the latest release of this app to its downstream app(s)",
  help: "Promote the latest release of this app to its downstream app(s).\n\nExample:\n  $ heroku pipelines:promote -a example-staging\n  Promoting example-staging to example (production)... done, v23\n  Promoting example-staging to example-admin (production)... done, v54",
  needsApp: true,
  needsAuth: true,
  run: cli.command(function* (context, heroku) {
    const app = context.app;

    const coupling = yield cli.action(`Fetching app info`, heroku.request({
      method: 'GET',
      path: `/apps/${app}/pipeline-couplings`,
      headers: { 'Accept': PIPELINES_HEADER }
    }));

    const allApps = yield cli.action(`Fetching apps from ${coupling.pipeline.name}`,
      heroku.request({
        method: 'GET',
        path: `/pipelines/${coupling.pipeline.id}/apps`,
        headers: { 'Accept': PIPELINES_HEADER }
      }));

    const sourceStage = coupling.stage;
    const targetStage = PROMOTION_ORDER[PROMOTION_ORDER.indexOf(sourceStage) + 1];

    if (targetStage === null || PROMOTION_ORDER.indexOf(sourceStage) < 0) {
      throw new Error(`Cannot promote ${app} from '${sourceStage}' stage`);
    }

    const targetApps = allApps.filter(function(app) {
      return app.coupling.stage === targetStage;
    });

    if (targetApps.length < 1) {
      throw new Error(`Cannot promote from ${app} as there are no downstream apps in ${targetStage} stage`);
    }

    const promotion = yield cli.action(`Starting promotion to ${targetStage}`, heroku.request({
      method: 'POST',
      path: `/pipeline-promotions`,
      headers: { 'Accept': PIPELINES_HEADER, },
      body: {
        pipeline: { id: coupling.pipeline.id },
        source:   { app: { id: coupling.app.id } },
        targets:  targetApps.map(function(app) { return { app: { id: app.id } }; })
      }
    }));

    const pollLoop = pollPromotionStatus(heroku, promotion.id);
    const promotionTargets = yield cli.action('Waiting for promotion to complete', pollLoop);


    const appsByID = allApps.reduce(function(memo, app) {
      memo[app.id] = app;
      return memo;
    }, {});

    const styledTargets = promotionTargets.reduce(function(memo, target) {
      const app = appsByID[target.app.id];
      const details = [target.status];

      if (isFailed(target)) { details.push(target.error_message); }

      memo[app.name] = details;
      return memo;
    }, {});

    if (promotionTargets.every(isSucceeded)) {
      cli.log('\nPromotion successful');
    } else {
      cli.warn('\nPromotion to some apps failed');
    }

    cli.styledHash(styledTargets);
  })
};
