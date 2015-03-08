var tmpdir = require('os').tmpdir;
var path = require('path');
var fs = require('fs');
var request = require('request');
var child = require('child_process');

const BOOT2DOCKER_PKG = 'https://github.com/boot2docker/osx-installer/releases/download/v1.5.0/Boot2Docker-1.5.0.pkg';

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'install',
    description: 'installs boot2docker',
    help: `help text for ${topic}:install`,
    run: function(context) {
      downloadB2D()
        .then(installB2D)
        .then(forwardPorts)
        .catch(onFailure);
    }
  };
};

function downloadB2D() {
  console.log('downloading (this can take a while)...');

  return new Promise(function(resolve, reject) {
    var outPath = path.join(tmpdir(), 'boot2docker.pkg');
    var outStream = fs.createWriteStream(outPath);

    outStream
      .on('error', reject)
      .on('close', resolve.bind(this, outPath));

    request
      .get(BOOT2DOCKER_PKG)
      .on('error', reject)
      .pipe(outStream);
  });
}

function installB2D(pkg) {
  try {
    console.log('installing...');
    child.execSync('open -W ' + pkg);
    console.log('initializing boot2docker vm...');
    child.execSync('boot2docker init');
    console.log('upgrading boot2docker...');
    child.execSync('boot2docker upgrade');
    return Promise.resolve();
  }
  catch (e) {
    return Promise.reject(e);
  }
}

function forwardPorts() {
  console.log('forwarding port 3000...');
  try {
    child.execSync(`VBoxManage modifyvm "boot2docker-vm" --natpf1 "tcp-port3000,tcp,,3000,,3000";`);
    return Promise.resolve();
  }
  catch (e) {
    return Promise.reject(e);
  }
}

function onFailure(err) {
  console.log('Installation failed:', err.stack);
}
