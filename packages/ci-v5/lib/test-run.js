const api = require('./heroku-api')

async function waitForStates(states, testRun, {heroku}) {
  while (!states.includes(testRun.status)) {
    // eslint-disable-next-line no-await-in-loop
    testRun = await api.testRun(heroku, testRun.pipeline.id, testRun.number)
    // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return testRun
}

module.exports = {
  waitForStates,
}
