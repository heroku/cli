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

Now write server.js:

```js
var PORT = process.env.PORT || 3000;

require('express')()
  .use(function(req, res, next) {
    res.send('Hello, world!');
  })
  .listen(PORT, onListen);

function onListen(err) {
  console.log('Listening on', PORT);
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

Then open your running app:

```
heroku docker:open
```

# Release your app to Heroku

```
git init
heroku create
heroku docker:release
heroku open
```
