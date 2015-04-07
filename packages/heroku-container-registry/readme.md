Heroku CLI Docker Plugin

# Install the plugin

```
heroku plugins:install heroku-docker
```

# (Optional) Set up boot2docker

```
heroku docker:boot2docker
boot2docker start
$(boot2docker shellinit)
```

# Create a local development environment

```
mkdir myproject
cd myproject
heroku docker:create --template node
```

This creates the default node Dockerfile:

```
cat Dockerfile
```

Ensure the environment works:

```
heroku docker:run node --version
```

# Start with hello world

Echo out a simple server.js:

```
echo 'console.log("Hello, world!");' > server.js
```

Now run it in your development container:

```
heroku docker:start
```

# Upgrade to an actual server

```
heroku docker:run npm init # keep all defaults
heroku docker:run npm install --save express
```

Now replace server.js with:

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
open http://localhost:3000
```

# Release your app to Heroku

```
git init
heroku create
heroku docker:release
heroku open
```
