'use strict';
let fs      = require('fs');
let path    = require('path');
let request = require('request');
let spawn   = require('child_process').spawn;

const foregoVersion = '0.16.1';
let foregoFilename = `forego-${foregoVersion}`;

if (process.platform === 'windows') {
  foregoFilename = `forego-${foregoVersion}.exe`;
}

function foregoURL() {
  let arch, platform;
  let filename = 'forego';
  switch (process.arch) {
    case 'x64':
      arch = 'amd64';
    break;
    case 'ia32':
      arch = '386';
    break;
    default:
      throw new Error(`Unsupported architecture: ${process.arch}`);
  }
  switch (process.platform) {
    case 'darwin':
      platform = 'darwin';
    break;
    case 'linux':
      platform = 'linux';
    break;
    case 'win32':
      platform = 'windows';
      filename = 'forego.exe';
    break;
    default:
      throw new Error(`Unsupported architecture: ${process.arch}`);
  }
  return `https://godist.herokuapp.com/projects/ddollar/forego/releases/${foregoVersion}/${platform}-${arch}/${filename}`;
}

function handleErr (err) {
  console.error(err.stack);
  process.exit(1);
}

function downloadForego (path, cb) {
  process.stderr.write(`Downloading ${foregoFilename} to ${path}... `);
  request(foregoURL(), function (err) {
    if (err) { handleErr(err); }
    console.error('done');
    // for some reason this seems necessary
    setTimeout(cb, 500);
  })
  .pipe(fs.createWriteStream(path, {mode: 0o0755}));
}

function ensureSetup (path, cb) {
  fs.open(path, 'r', function (err) {
    if (err) {
      downloadForego(path, cb);
    } else {
      cb();
    }
  });
}

function start (opts) {
  let args = ['start'];
  if (opts.args.processname) {
    args.push(opts.args.processname);
  }
  console.log(opts.args);
  spawn(opts.path, args, {
    cwd: opts.cwd,
    stdio: [0, 1, 2]
  });
}

module.exports = {
  topic: 'local',
  command: 'start',
  description: 'run heroku app locally',
  help: 'TODO',
  args: [{name: 'processname', optional: true}],
  flags: [
    {name: 'procfile', char: 'f', hasValue: true},
    {name: 'env', char: 'e', hasValue: true},
    {name: 'concurrency', char: 'c', hasValue: true},
    {name: 'port', char: 'p', hasValue: true},
    {name: 'r', char: 'r', hasValue: true}
  ],
  run: function (ctx) {
    var foregoPath = path.join(ctx.herokuDir, foregoFilename);
    ensureSetup(foregoPath, function () {
      start({path: foregoPath, cwd: ctx.cwd, args: ctx.args});
    });
  }
};
