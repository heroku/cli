'use strict';

let cli      = require('heroku-cli-util');
let fs       = require('fs');
let path     = require('path');
let download = require('./download');
let sha      = require('./sha');
let spawn    = require('child_process').spawn;

let target = require('../download_info.json').filter(function (target) {
  if (target.arch === process.arch && target.platform === process.platform) return target;
})[0];

function Forego(dir) {
  if (!target) { console.error(`No forego binaries are available for ${process.arch} ${process.platform}.\nYou can alternatively use forego by compiling it yourself. https://github.com/ddollar/forego`); process.exit(1); }
  this.dir = dir;
  this.path = path.join(this.dir, target.filename);
}

Forego.prototype = {
  version: function () {
    spawn(this.path, ['version'], { stdio: 'inherit' });
  },

  start: function (opts) {
    let args = ['start'];
    if (opts.flags.procfile)    args.push('-f', opts.flags.procfile);
    if (opts.flags.env)         args.push('-e', opts.flags.env);
    if (opts.flags.concurrency) args.push('-c', opts.flags.concurrency);
    if (opts.flags.port)        args.push('-p', opts.flags.port);
    if (opts.flags.restart)     args.push('-r');
    if (opts.args.processname)  args.push(opts.args.processname);
    spawn(this.path, args, {stdio: 'inherit'});
  },

  run: function (args, opts) {
    if (opts.flags.env)  args.unshift('-e', opts.flags.env);
    if (opts.flags.port) args.unshift('-p', opts.flags.port);
    args.unshift('run');
    // TODO: find out why spring does not work
    process.env.DISABLE_SPRING = 1;
    spawn(this.path, args, {stdio: 'inherit'});
  },

  ensureSetup: function () {
    let forego = this;
    return new Promise(function (fulfill, reject) {
      fs.open(forego.path, 'r', function (err) {
        if (err) {
          forego.download().then(fulfill, reject);
        } else {
          fulfill();
        }
      });
    });
  },

  download: function () {
    let forego = this;
    return cli.action(`Downloading ${target.filename} to ${forego.dir}`,
                      download.file(target.url, forego.path, {mode: 0o0755})
                      .then(function () { return forego.verify(); })
                     );
  },

  verify: function () {
    let forego = this;
    return sha.file(forego.path)
    .then(function (sha) {
      if (sha !== target.sha) {
        fs.unlinkSync(forego.path);
        throw new Error(`SHA mismatch. Expected ${sha} to be ${target.sha}.`);
      }
    });
  }
};

module.exports = Forego;
