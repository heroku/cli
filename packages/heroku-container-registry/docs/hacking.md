# Hacking on the plugin

You want to add new language support? Awesome!
We're in the very early stages of exploring the possibilities of Docker + Heroku,
so all ideas are welcome.

The simplest way to get started is to clone the repo and symlink it to your
local Heroku client:

```
make link
```

When you'd like to go back to using the official release:

```
make unlink
heroku plugins:install heroku-docker
```

While developing, you can run the basic test suite:

```
npm test
```

## Platform API

All of the language support is in [/platforms](/platforms).
To support a new platform, create a new directory with an index.js that
exposes the following fields:

### `name {String}`

The name of the platform (node, java, etc).

### `detect(dir) {Function:Boolean}`

A function that returns `true` only if you detect that your platform is
probably present in `dir`. For example, the node platform checks for
the presence of a `package.json` file.

### `getDockerfile(dir) {Function:String}`

A function that returns the contents of a Dockerfile as a string.
This Dockerfile will be used as the executable Dockerfile for
projects running your platform.

Two image types are created from each Dockerfile. The first is the
`exec` image, which is used for a development environment. For example,
node uses the `exec` image to run commands like `npm install` so that installed
dependencies will be built for Heroku's Cedar-14 (Ubuntu) platform.

The second image type is used for `start` and for `release`, and it's
created via a 1-line temporary Dockerfile inheriting (FROM) the `exec` image.

Thus, when you write your Dockerfile, if you want commands to be run
only in the `start` and `release` phases, you should prefix those commands
with `ONBUILD`.

The best way to start is by checking out the
[existing code in platforms](/platforms).

## Documentation

Once you've got a working platform, be sure to document how to use it
with at least one example. One of the coolest parts about this Docker
workflow is how easy it is to get started quickly. Since all dependencies
are self-contained, you should be able to create a hello-world type
example that doesn't require the user to install anything new.

## Pull requests

When your changes are ready, just send a PR - I'm aggressively
merging them even when they're works in progress so we can keep momentum up.

And thank you!
