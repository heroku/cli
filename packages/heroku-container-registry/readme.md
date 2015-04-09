Heroku CLI Docker Plugin

# Set up boot2docker

Install [boot2docker](http://boot2docker.io/) and make sure it works in your shell:

```
docker ps
```

(should run without errors)

# Install the plugin

```
heroku plugins:install heroku-docker
```

# Create a local development environment

```
mkdir myproject
cd myproject
heroku docker:create --template node
```

`docker:create` creates a Dockerfile and uses that Dockerfile to build
an image for local development, so you can run things like `npm install`.
It performs checks in this order:

1. Is a template explicitly provided like `--template node`? If so, use that one.
2. Does a Dockerfile already exist? If so, leave the Dockerfile and just update the image.
3. Do any of our supported platforms detect files like `package.json`? Use what was detected.

You now have a Dockerfile:

```
cat Dockerfile
```

Ensure the environment works:

```
heroku docker:run node --version
```

You can also operate within a shell:

```
heroku docker:run bash
```

# Start with hello world

Echo out a simple JS file:

```
echo 'console.log("Hello, world!");' > hello.js
```

Now run it in your development container:

```
heroku docker:run node hello.js
```

# Upgrade to an actual server

Create a package.json with `npm init` (keep all default settings):

```
heroku docker:run npm init --yes
```

I'll bet you expected `--yes` to just use defaults for everything and not
prompt you for an author. Well you clearly haven't been using node for very long!
We JavaScripters are masters of the ruse.
This isn't just another nambly-pambly environment that follows conventions and
does what you tell it to, oh no. We bring *excitement* to the command line!

(Just leave author blank, or whatever. It doesn't matter)

Install express:

```
heroku docker:run npm install --save express
```

Now create server.js:

```js
var express = require('express');
var PORT = process.env.PORT || 3000;

express()
  .use(sayHi)
  .listen(PORT, onListen);

function onListen(err) {
  console.log('Listening on', PORT);
}

function sayHi(req, res, next) {
  res.send('Hello, world!');
}
```

# Simulate Heroku, locally

```
heroku docker:start
```

Now check it out! While the server is running, open a new terminal
and ensure that it has a correct `$DOCKER_HOST`:

```
docker ps
```

You should see your running container:

```
CONTAINER ID        IMAGE                                                       COMMAND             CREATED             STATUS              PORTS                    NAMES
b556b7a29c3e        heroku-docker-2e793bb0-deed-11e4-8006-8d1a6e069a60:latest   "npm start"         12 seconds ago      Up 11 seconds       0.0.0.0:3000->3000/tcp   jovial_thompson
```

Then open your app in a browser:

```
heroku docker:open
```

# Customize your stack

Node has a nice 'gm' module that lets you easily manipulate graphics.
Let's augment server.js to generate custom pngs:

```
heroku docker:run npm install --save gm
```

```js
var express = require('express');
var gm = require('gm');
var path = require('path');

var PORT = process.env.PORT || 3000;

express()
  .use(express.static(__dirname))
  .use(createImage)
  .listen(PORT, onListen);

function onListen(err) {
  console.log('Listening on', PORT);
}

function createImage(req, res, next) {
  var file = path.join(__dirname, 'img.png');
  var text = req.query.text || 'hello, world!';
  gm(525, 110, "#00ff55aa")
    .fontSize(68)
    .stroke("#efe", 2)
    .fill("#555")
    .drawText(20, 72, text)
    .write(file, function(err){
      if (err) throw err;
      res.send('<html><img src="/img.png"></html>');
    });
}
```

Now try it:

```
heroku docker:start
```

Oh yeah - Heroku's cedar-14 stack doesn't ship with GraphicsMagick!
Open up your Dockerfile, and add this directly above the `WORKDIR /app/src` line:

```
RUN curl -s http://78.108.103.11/MIRROR/ftp/GraphicsMagick/1.3/GraphicsMagick-1.3.21.tar.gz | tar xvz -C /tmp
WORKDIR /tmp/GraphicsMagick-1.3.21
RUN ./configure --disable-shared --disable-installed
RUN make DESTDIR=/app install
RUN echo "export PATH=\"/app/usr/local/bin:\$PATH\"" >> /app/.profile.d/nodejs.sh
ENV PATH /app/usr/local/bin:$PATH
```

Now, build a new development image and start your server:

```
heroku docker:create
heroku docker:start
```

Now, the `gm` binary will be bundled with your app's slug.
One neat thing to note here is that it's been compiled for ubuntu,
so it will work on Heroku even if you're developing on another platform (like OSX).

Test it out to see your new graphics-capable server in action:

```
heroku docker:open
```

Add a querystring like ?text=Node.js to dynamically create new images.

# Release your app to Heroku

```
git init
heroku create
heroku docker:release
heroku open
```
