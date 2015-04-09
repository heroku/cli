var path = require('path');
var child = require('child_process');
var fs = require('fs');
var _ = require('lodash');
var uuid = require('node-uuid');

module.exports = {
  buildEphemeralImage: buildEphemeralImage,
  writeDockerfile: writeDockerfile,
  buildImage: buildImage
};

function buildEphemeralImage(dir, contents) {
  var filename = `Dockerfile-${uuid.v1()}`;
  var dockerfile = path.join(dir, filename);
  fs.writeFileSync(dockerfile, contents, { encoding: 'utf8' });
  var imageId = buildImage(dir, dockerfile);
  fs.unlinkSync(dockerfile);
  return imageId;
}

function writeDockerfile(filePath, templatePath, values) {
  console.log('creating Dockerfile...');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var compiled = _.template(template);
  var dockerfile = compiled(values || {});
  fs.writeFileSync(filePath, dockerfile, { encoding: 'utf8' });
}

function buildImage(dir, dockerfile) {
  console.log('building image...');
  var tag = `heroku-docker-${uuid.v1()}`;
  var build = child.execSync(`docker build --force-rm --file="${dockerfile}" --tag="${tag}" ${dir}`, {
    stdio: [0, 1, 2]
  });
  return tag;
}
