const api = require('./heroku-api')

async function waitForStates(states, testRun, {heroku}) {
  while (!states.includes(testRun.status)) {
    testRun = await api.testRun(heroku, testRun.pipeline.id, testRun.number)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return testRun
}

module.exports = {
  waitForStates,
}
