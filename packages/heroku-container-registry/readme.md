Heroku CLI Docker Plugin

# Install the plugin

```
heroku plugins:install heroku-docker
```

# Set up boot2docker

```
heroku docker:boot2docker
boot2docker start
$(boot2docker shellinit)
```

# Create a local development environment

```
mkdir myproject
cd myproject
heroku docker:create
```

Ensure the environment works:

```
heroku docker:run node --version
```

# Start with hello world

In your favorite text editor, create a 1-line server.js file:

```
echo 'console.log("Hello, world!");' > server.js
```

Now run it in your development container:

```
heroku docker:run node server.js
```

# Upgrade to an actual server

```
heroku docker:run npm init # keep all defaults
heroku docker:run npm install --save express
```

In server.js:

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

Now connect to the server in your development container:

```
heroku docker:run node server.js
open http://localhost:3000
```

# Simulate a Heroku build, locally

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
