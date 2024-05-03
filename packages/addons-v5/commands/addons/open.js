'use strict'

let cli = require('@heroku/heroku-cli-util')
let fs = require('fs')
let os = require('os')
let path = require('path')

function open(url) {
  cli.log(`Opening ${cli.color.cyan(url)}...`)
  return cli.open(url)
}

const ssoPath = path.join(os.tmpdir(), 'heroku-sso.html')

function writeSudoTemplate(ctx, sso, path) {
  return new Promise(function (resolve, reject) {
    let html = `<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="utf-8">
    <title>Heroku Add-ons SSO</title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
  </head>

  <body>
    <h3>Opening ${ctx.args.addon}${ctx.app ? ` on ${ctx.app}` : ''}...</h3>
    <form method="POST" action="${sso.action}">
    </form>

    <script>
      var params = ${JSON.stringify(sso.params)}
      var form = document.forms[0]
      $(document).ready(function() {
        $.each(params, function(key, value) {
          $('<input>').attr({ type: 'hidden', name: key, value: value })
            .appendTo(form)
        })
        form.submit()
      })
    </script>
  </body>
</html>`
    fs.writeFile(path, html, function (err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

let sudo = async function (ctx, api) {
  let sso = await api.request({
    method: 'GET',
    path: `/apps/${ctx.app}/addons/${ctx.args.addon}/sso`,
    headers: {
      Accept: 'application/vnd.heroku+json; version=3.add-ons-sso',
    },
  })
  if (sso.method === 'get') {
    await open(sso.action)
  } else {
    await writeSudoTemplate(ctx, sso, ssoPath)
    await open(`file://${ssoPath}`)
  }
}

async function run(ctx, api) {
  const resolve = require('../../lib/resolve')

  if (process.env.HEROKU_SUDO) return sudo(ctx, api)

  let attachment = await resolve.attachment(api, ctx.app, ctx.args.addon)
    .catch(function (error) {
      if (error.statusCode !== 404) throw error
    })

  let webUrl
  if (attachment) {
    webUrl = attachment.web_url
  } else {
    let addon = await resolve.addon(api, ctx.app, ctx.args.addon)
    webUrl = addon.web_url
  }

  if (ctx.flags['show-url']) {
    cli.log(webUrl)
  } else {
    await open(webUrl)
  }
}

module.exports = {
  topic: 'addons',
  command: 'open',
  wantsApp: true,
  needsAuth: true,
  args: [{name: 'addon'}],
  flags: [{name: 'show-url', description: 'show URL, do not open browser'}],
  run: cli.command({preauth: true}, run),
  description: "open an add-on's dashboard in your browser",
}
