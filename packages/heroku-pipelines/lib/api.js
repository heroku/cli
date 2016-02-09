const V3_HEADER = 'application/vnd.heroku+json; version=3';

function getCoupling(heroku, app) {
  return heroku.request({
    method: 'GET',
    path: `/apps/${app}/pipeline-couplings`,
    headers: { 'Accept': V3_HEADER }
  });
}

function postCoupling(heroku, pipeline, app, stage) {
  return heroku.request({
    method: 'POST',
    path: '/pipeline-couplings',
    body: {app: app, pipeline: pipeline, stage: stage},
    headers: { 'Accept': V3_HEADER }
  });
}

function patchCoupling(heroku, id, stage) {
  return heroku.request({
    method: 'PATCH',
    path: `/pipeline-couplings/${id}`,
    body: {stage: stage},
    headers: { 'Accept': V3_HEADER }
  });
}

function deleteCoupling(heroku, id) {
  return heroku.request({
    method: 'DELETE',
    path: `/pipeline-couplings/${id}`,
    headers: { 'Accept': V3_HEADER }
  });
}

function createCoupling(heroku, pipeline, app, stage) {
  return postCoupling(heroku, pipeline.id, app, stage);
}

function updateCoupling(heroku, app, stage) {
  return getCoupling(heroku, app)
           .then(coupling => patchCoupling(heroku, coupling.id, stage));
}

function removeCoupling(heroku, app) {
  return getCoupling(heroku, app)
           .then(coupling => deleteCoupling(heroku, coupling.id));
}

exports.getCoupling    = getCoupling;
exports.postCoupling   = postCoupling;
exports.patchCoupling  = patchCoupling;
exports.deleteCoupling = deleteCoupling;

exports.createCoupling = createCoupling;
exports.updateCoupling = updateCoupling;
exports.removeCoupling = removeCoupling;
