'use strict';
let fs      = require('fs');
let path    = require('path');
let request = require('request');
let spawn   = require('child_process').spawn;

const foregoVersion = '0.16.1';

function Forego(dir) {
  this.dir = dir;
  this.filename = `forego-${foregoVersion}`;

  if (process.platform === 'windows') {
    this.filename = `forego-${foregoVersion}.exe`;
  }

  this.path = path.join(this.dir, this.filename);

}

Forego.prototype = {
  version: function () {
    spawn(this.path, ['version'], { stdio: [0, 1, 2] });
  },

  start: function (opts) {
    let args = ['start'];
    if (opts.args.processname) {
      args.push(opts.args.processname);
    }
    if (opts.args.procfile) {
      args.push('-f', opts.args.procfile);
    }
    if (opts.args.env) {
      args.push('-e', opts.args.env);
    }
    if (opts.args.concurrency) {
      args.push('-c', opts.args.concurrency);
    }
    if (opts.args.port) {
      args.push('-p', opts.args.port);
    }
    if (opts.args.r) {
      args.push('-r');
    }
    spawn(this.path, args, {
      cwd: opts.cwd,
      stdio: [0, 1, 2]
    });
  },

  ensureSetup: function (cb) {
    fs.open(this.path, 'r', function (err) {
      if (err) {
        this.download(cb);
      } else {
        cb();
      }
    });
  },

  download: function (cb) {
    process.stderr.write(`Downloading ${this.filename} ${this.dir}... `);
    request(this.foregoURL(), function (err) {
      if (err) { cb(err); }
      console.error('done');
      // for some reason this seems necessary
      setTimeout(cb, 500);
    })
    .pipe(fs.createWriteStream(this.path, {mode: 0o0755}));
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
