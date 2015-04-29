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
  runImage: runImage
};

function runImage(imageId, cwd, command, mount) {
  if (!imageId) return;
  var mountDir = crossPlatformCwd(cwd);
  var mountComponent = mount ? `-v "${mountDir}:/app/src"` : '';
  var envArgComponent = directory.getFormattedEnvArgComponent(cwd);
  var runCommand = `docker run -w /app/src -p 3000:3000 --rm -it ${mountComponent} ${envArgComponent} ${imageId} sh -c "${command}" || true`;
  var result = child.execSync(runCommand, {
    stdio: this.silent ? [0, 'pipe', 'pipe'] : 'inherit'
  });
  return Buffer.isBuffer(result) ?
    result.toString().trim() : result;
}

function buildImage(dir, id, dockerfile) {
  cli.log('building image...');
  var dockerfile = dockerfile || path.join(dir, FILENAME);
  var build = child.execSync(`docker build --force-rm --file="${dockerfile}" --tag="${id}" "${dir}"`, {
    stdio: this.silent ? [0, 'pipe', 'pipe'] : 'inherit'
  });
  return id;
}

function ensureExecImage(dir) {
  var dockerfile = path.join(dir, FILENAME);
  try {
    var contents = fs.readFileSync(dockerfile, { encoding: 'utf8' });
    var hash = createHash(contents);
    var imageId = getImageId(hash);
    imageExists(imageId) || this.buildImage(dir, imageId);
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
  return getAllImages().indexOf(id) !== -1;
}

function getAllImages() {
  var stdout = child.execSync(`docker images`, { encoding: 'utf8' });
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
