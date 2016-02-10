'use strict';

let fs      = require('fs');
let https   = require('https');
let url     = require('url');
let cli     = require('heroku-cli-util');
let tunnel  = require('tunnel-agent');

function file (urlStr, path, opts) {
  let tmpPath = path + '.tmp';
  return new Promise(function (fulfill, reject) {
    let httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    let agent;
    if (httpsProxy) {
      cli.hush(`proxy set to ${httpsProxy}`);
      let proxy = url.parse(httpsProxy);

      agent = tunnel.httpsOverHttp({
        proxy: {
          host: proxy.hostname,
          port: proxy.port || 8080
        }
      });
    } else {
      agent = new https.Agent();
    }

    let requestOptions = url.parse(urlStr);
    requestOptions.agent = agent;

    let req = https.request(requestOptions, function (res) {
      if (res.statusCode > 200 || res.statusCode >= 300) return reject(new Error(res.body));
      res.pipe(fs.createWriteStream(tmpPath, opts));
      res.on('end', fulfill);
    });
    req.on('error', reject);
    req.end();

  })
  .then(() => fs.renameSync(tmpPath, path));
}

module.exports = {
  file,
};
