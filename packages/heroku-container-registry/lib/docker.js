var path = require('path');
var child = require('child_process');
var fs = require('fs');
var _ = require('lodash');
var uuid = require('node-uuid');
var crypto = require('crypto');

const FILENAME = 'Dockerfile';

module.exports = {
  filename: FILENAME,
  buildImage: buildImage,
  ensureExecImage: ensureExecImage,
  ensureStartImage: ensureStartImage
};

function buildImage(dir, id, dockerfile) {
  console.log('building image...');
  var dockerfile = dockerfile || path.join(dir, FILENAME);
  var build = child.execSync(`docker build --force-rm --file="${dockerfile}" --tag="${id}" ${dir}`, {
    stdio: [0, 1, 2]
  });
  return id;
}

function ensureExecImage(dir) {
  var dockerfile = path.join(dir, FILENAME);
  var contents = fs.readFileSync(dockerfile, { encoding: 'utf8' });
  var hash = createHash(contents);
  var imageId = getImageId(hash);
  imageExists(imageId) || buildImage(dir, imageId);
  return imageId;
}

function ensureStartImage(dir) {
  var execImageId = ensureExecImage(dir);
  var contents = `FROM ${execImageId}`;
  var imageId = `${execImageId}-start`;
  var filename = `.Dockerfile-${uuid.v1()}`;
  var filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, contents, { encoding: 'utf8' });
  try {
    buildImage(dir, imageId, filepath);
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
