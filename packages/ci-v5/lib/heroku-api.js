const KOLKRABBI = 'https://kolkrabbi.heroku.com'
const V3_HEADER = 'application/vnd.heroku+json; version=3'
const VERSION_HEADER = `${V3_HEADER}.ci`
const PIPELINE_HEADER = `${V3_HEADER}.pipelines`

async function pipelineCoupling(client, app) {
  return client.get(`/apps/${app}/pipeline-couplings`)
}

async function pipelineRepository(client, pipelineID) {
  return client.request({
    host: KOLKRABBI,
    path: `/pipelines/${pipelineID}/repository`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
    },
  })
}

async function getDyno(client, appID, dynoID) {
  return client.request({
    path: `/apps/${appID}/dynos/${dynoID}`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER,
    },
  })
}

async function githubArchiveLink(client, user, repository, ref) {
  return client.request({
    host: KOLKRABBI,
    path: `/github/repos/${user}/${repository}/tarball/${ref}`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
    },
  })
}

async function testRun(client, pipelineID, number) {
  return client.request({
    path: `/pipelines/${pipelineID}/test-runs/${number}`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER,
    },
  })
}

async function testNodes(client, testRunIdD) {
  return client.request({
    path: `/test-runs/${testRunIdD}/test-nodes`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER,
    },
  })
}

async function testRuns(client, pipelineID) {
  return client.request({
    path: `/pipelines/${pipelineID}/test-runs`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER,
    },
  })
}

async function latestTestRun(client, pipelineID) {
  const latestTestRuns = await client.request({
    path: `/pipelines/${pipelineID}/test-runs`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER,
      Range: 'number ..; order=desc,max=1',
    },
  })

  return Promise.resolve(latestTestRuns[0])
}

function updateTestRun(client, id, body) {
  return client.request({
    body,
    method: 'PATCH',
    path: `/test-runs/${id}`,
    headers: {
      Accept: VERSION_HEADER,
    },
  })
}

async function createSource(client) {
  return await client.post('/sources')
}

async function createTestRun(client, body) {
  const headers = {
    Accept: VERSION_HEADER,
  }

  return client.request({
    headers: headers,
    method: 'POST',
    path: '/test-runs',
    body: body,
  })
}

function setConfigVars(client, pipelineID, body) {
  return client.request({
    method: 'PATCH',
    headers: {Accept: PIPELINE_HEADER},
    path: `/pipelines/${pipelineID}/stage/test/config-vars`,
    body,
  })
}

module.exports = {
  createSource,
  createTestRun,
  getDyno,
  githubArchiveLink,
  latestTestRun,
  testNodes,
  testRun,
  testRuns,
  pipelineCoupling,
  pipelineRepository,
  setConfigVars,
  updateTestRun,
}
