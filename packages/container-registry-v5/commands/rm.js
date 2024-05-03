const cli = require('@heroku/heroku-cli-util')

let usage = `
    ${cli.color.bold.underline.magenta('Usage:')}
    ${cli.color.cmd('heroku container:rm web')}        # Destroys the web container
    ${cli.color.cmd('heroku container:rm web worker')} # Destroys the web and worker containers`

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'rm',
    description: 'remove the process type from your app',
    needsApp: true,
    needsAuth: true,
    variableArgs: true,
    help: usage,
    flags: [],
    run: cli.command(rm),
  }
}

let rm = async function (context, heroku) {
  if (context.args.length === 0) {
    cli.exit(1, `Error: Please specify at least one target process type\n ${usage} `)
  }

  for (let container of context.args) {
    let r = heroku.request({
      method: 'PATCH',
      path: `/apps/${context.app}/formation/${container}`,
      headers: {Accept: 'application/vnd.heroku+json; version=3.docker-releases'},
      body: {docker_image: null},
    })
    await cli.action(`Removing container ${container} for ${cli.color.app(context.app)}`, r)
  }
}
