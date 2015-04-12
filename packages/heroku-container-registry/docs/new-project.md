# Create a local development environment

```
mkdir myproject
cd myproject
heroku docker:init --template node
```

You now have a Dockerfile:

```
cat Dockerfile
```

Ensure the environment works:

```
heroku docker:exec node --version
```

# Start with hello world

Echo out a simple JS file:

```
echo 'console.log("Hello, world!");' > hello.js
```

Now run it in your development container:

```
heroku docker:exec node hello.js
```

# Upgrade to an actual server

Create a package.json with `npm init` (keep all default settings),
then install express:

```
heroku docker:exec npm init
heroku docker:exec npm install --save express
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

While the server is running, open a new terminal
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
heroku docker:exec npm install --save gm
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
heroku docker:open
```

**Error!?**
Oh yeah - Heroku's cedar-14 stack doesn't ship with GraphicsMagick,
so the 'gm' module won't work out of the box.
Open up your Dockerfile, and add this directly above the *2nd* WORKDIR line (`WORKDIR /app/src`):

```
RUN curl -s http://78.108.103.11/MIRROR/ftp/GraphicsMagick/1.3/GraphicsMagick-1.3.21.tar.gz | tar xvz -C /tmp
WORKDIR /tmp/GraphicsMagick-1.3.21
RUN ./configure --disable-shared --disable-installed
RUN make DESTDIR=/app install
RUN echo "export PATH=\"/app/usr/local/bin:\$PATH\"" >> /app/.profile.d/nodejs.sh
ENV PATH /app/usr/local/bin:$PATH
```

Now try it again with the updated Dockerfile (new images will automatically be built):

```
heroku docker:start
heroku docker:open
```

With those Dockerfile changes, the `gm` binary will be bundled with your app's slug.
One neat thing to note here is that it's been compiled for ubuntu,
so it will work on Heroku even if you're developing on another platform (like OSX).

Add a querystring like ?text=Node.js to dynamically create new images.

# Release your app to Heroku

```
git init
heroku create
heroku docker:release
heroku open
```

Congratulations! You have a Node.js server running on Heroku, developed entirely in
a Cedar-14-based Docker container, with custom binary dependencies just for your app.

You can see an example here:

- [https://docker-gm.herokuapp.com](https://docker-gm.herokuapp.com/?text=Heroku%2BDocker)
