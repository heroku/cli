'use strict';
let fs      = require('fs');
let path    = require('path');
let request = require('request');
let spawn   = require('child_process').spawn;

const foregoVersion = '0.16.1';

function Forego(dir) {
  this.dir = dir;

  if (process.platform === 'windows') {
    this.filename = `forego-${foregoVersion}.exe`;
  } else {
    this.filename = `forego-${foregoVersion}`;
  }

  this.path = path.join(this.dir, this.filename);

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
    process.env['DISABLE_SPRING'] = 1;
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
    return new Promise(function (fulfill, reject) {
      process.stderr.write(`Downloading ${forego.filename} to ${forego.dir}... `);
      request(forego.url(), function (err) {
        if (err) { reject(err); }
        console.error('done');
        // for some reason this seems necessary
        setTimeout(fulfill, 500);
      })
      .pipe(fs.createWriteStream(forego.path, {mode: 0o0755}));
    });
  },

  url: function() {
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
};

module.exports = Forego;
