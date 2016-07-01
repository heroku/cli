'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let fs = require('fs')

function open (url) {
  cli.log(`Opening ${cli.color.cyan(url)}...`)
  return cli.open(url)
}

const ssoPath = '/tmp/heroku-sso.html'

function writeSudoTemplate (ctx, sso, path) {
  return new Promise(function (resolve, reject) {
    let html = `<!DOCTYPE HTML>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Heroku Add-ons SSO</title>
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
  </head>

  <body>
    <h3>Opening ${ctx.args.addon}${ctx.app ? ` on ${ctx.app}` : ''}...</h3>
    <form method="POST" action="${sso.action}">
    </form>

    <script type="text/javascript">
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

let sudo = co.wrap(function * (ctx, api) {
  let sso = yield api.request({
    method: 'GET',
    path: `/apps/${ctx.app}/addons/${ctx.args.addon}/sso`,
    headers: {Accept: 'application/json'}
  })
  if (sso.method === 'get') {
    yield open(sso.action)
  } else {
    yield writeSudoTemplate(ctx, sso, ssoPath)
    yield open(`file://${ssoPath}`)
  }
})

function * run (ctx, api) {
  const resolve = require('../../lib/resolve')

  if (process.env.HEROKU_SUDO) return sudo(ctx, api)

  let attachment = yield resolve.attachment(api, ctx.app, ctx.args.addon)
  let webUrl

  if (attachment) {
    webUrl = attachment.web_url
  } else {
    let addon = yield resolve.addon(api, ctx.app, ctx.args.addon)
    webUrl = addon.web_url
  }

  if (ctx.flags['show-url']) {
    cli.log(webUrl)
  } else {
    yield open(webUrl)
  }
}

module.exports = {
  topic: 'addons',
  command: 'open',
  wantsApp: true,
  needsAuth: true,
  args: [{name: 'addon'}],
  flags: [{name: 'show-url', description: 'show URL, do not open browser'}],
  run: cli.command({preauth: true}, co.wrap(run)),
  description: "open an add-on's dashboard in your browser"
}
