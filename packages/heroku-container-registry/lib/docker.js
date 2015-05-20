var path = require('path');
var child = require('child_process');
var fs = require('fs');
var _ = require('lodash');
var uuid = require('node-uuid');
var crypto = require('crypto');
var os = require('os');
var cli = require('heroku-cli-util');
var directory = require('./directory');
require('prototypes');

const FILENAME = 'Dockerfile';

module.exports = {
  filename: FILENAME,
  silent: false,
  buildImage: buildImage,
  ensureExecImage: ensureExecImage,
  ensureStartImage: ensureStartImage,
  imageExists: imageExists,
  getAllImages: getAllImages,
  runImage: runImage,
  execSync: execSync
};

function execSync(command, streamOutput) {
  var stdio = (streamOutput && !this.silent) ? [ 0, 1, 'pipe'] : [ 0, 'pipe', 'pipe' ];
  try {
    return child.execSync(`docker ${command}`, {
      encoding: 'utf8',
      stdio: stdio
    });
  }
  catch (e) {
    var msg = e.message.toLowerCase();
    // TODO: more specific error messages
    if (msg.indexOf('/var/run/docker.sock') >= 0) {
      throw new Error('Unable to send commands to docker. Have you started docker (and boot2docker if necessary)?');
    }
    else if (msg.indexOf('an error occurred trying to connect') >= 0) {
      throw new Error('Unable to send commands to docker. Have you started docker (and boot2docker if necessary)?');
    }
    else {
      throw e;
    }
  }
}

function runImage(imageId, cwd, command, mount) {
  if (!imageId) return;
  var mountDir = crossPlatformCwd(cwd);
  var mountComponent = mount ? `-v "${mountDir}:/app/src"` : '';
  var envArgComponent = directory.getFormattedEnvArgComponent(cwd);
  var commandWithEnv = command.replace("$", "\\\$")
  var runCommand = `run -p 3000:3000 -e "PORT=3000" --rm -it ${mountComponent} ${envArgComponent} ${imageId} sh -c "${commandWithEnv}" || true`;
  return this.execSync(runCommand, true);
}

function buildImage(dir, id, dockerfile) {
  cli.log('building image...');
  var dockerfile = dockerfile || path.join(dir, FILENAME);
  this.execSync(`build --force-rm --file="${dockerfile}" --tag="${id}" "${dir}"`, true);
  return id;
}

function ensureExecImage(dir) {
  var dockerfile = path.join(dir, FILENAME);
  try {
    var contents = fs.readFileSync(dockerfile, { encoding: 'utf8' });
    var hash = createHash(contents);
    var imageId = getImageId(hash);
    this.imageExists(imageId) || this.buildImage(dir, imageId);
    return imageId;
  }
  catch (e) {
    if (e.code === 'ENOENT') {
      cli.error('No Dockerfile found, did you run `heroku docker:init`?');
      return;
    }
    else {
      throw e;
    }
  }
}

function ensureStartImage(dir) {
  var execImageId = this.ensureExecImage(dir);
  if (!execImageId) {
    return;
  }
  var contents = `FROM ${execImageId}`;
  var imageId = `${execImageId}-start`;
  var filename = `.Dockerfile-${uuid.v1()}`;
  var filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, contents, { encoding: 'utf8' });
  try {
    this.buildImage(dir, imageId, filepath);
  }
  catch (e) {
    fs.unlinkSync(filepath);
    throw new Error('Unable to create start image');
  }
  fs.unlinkSync(filepath);
  return imageId;
}

function createHash(contents) {
  var md5 = crypto.createHash('md5');
  md5.update(contents, 'utf8');
  var digest = md5.digest('hex');
  return digest;
}

function getImageId(hash) {
  return `heroku-docker-${hash}`;
}

function imageExists(id) {
  return this.getAllImages().indexOf(id) !== -1;
}

function getAllImages() {
  var stdout = this.execSync('images', false);
  if (!stdout) return [];
  return _.map(_.filter(stdout.split('\n'), isImage), lineToId);

  function isImage(line) {
    return line.indexOf('heroku-docker') === 0;
  }

  function lineToId(line) {
    return line.split(' ')[0];
  }
}

function crossPlatformCwd(cwd){
  if (os.platform() == 'win32') {
    // this is due to how volumes are mounted by boot2docker/virtualbox
    var p = path.parse(cwd);
    return path.posix.sep + p.root.split(':')[0].toLowerCase() + path.posix.sep
      + p.dir.substring(p.root.length).replaceAll(path.sep, path.posix.sep) + path.posix.sep + p.base;
  }
  return cwd;
}
