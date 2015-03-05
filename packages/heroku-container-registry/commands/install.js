var tmpdir = require('os').tmpdir;
var path = require('path');
var fs = require('fs');
var request = require('request');
var open = require('open');

const BOOT2DOCKER_PKG = 'https://github.com/boot2docker/osx-installer/releases/download/v1.5.0/Boot2Docker-1.5.0.pkg';

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'install',
    description: 'installs boot2docker',
    help: 'help text for ' + topic + ':install',
    run: function() {
      downloadB2D()
        .then(installB2D)
        .catch(onFailure);
    }
  };
};

function downloadB2D() {
  console.log('downloading...');

  return new Promise(function(resolve, reject) {
    var outFile = path.join(tmpdir(), 'boot2docker.pkg');
    var outStream = fs.createWriteStream(outFile);

    outStream
      .on('error', reject);

    request
      .get(BOOT2DOCKER_PKG)
      .on('error', reject)
      .on('end', resolve.bind(this, outFile))
      .pipe(outStream);
  });
}

function installB2D(pkg) {
  console.log('installing...');

  return new Promise(function(resolve, reject) {
    open(pkg);
    resolve();
  });
}

function onFailure(err) {
  console.log('Installation failed:', err.stack);
}
