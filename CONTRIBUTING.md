Contributing to the Heroku CLI
==============================

The v4 Heroku CLI is written in Go with Node modules. For more on the v4 architecture, [check out the README](https://github.com/heroku/heroku-cli/blob/master/README.md).

Commands can be written either in Go or as a Node module. Generally speaking if you want to contribute a new command it should be done in a Node module because these modules are easier to write and we have established good testing strategies for them. There are some exceptions to changes that would need to be in Go:

* Authorization code. Go currently contains all the authorization logic as well as the netrc parser. We don't have a fully compatible netrc parser for Node so anything that needs to read/write netrc files should be done in Go.
* "Gode" code. Gode is the library that directly interfaces Go with Node in the CLI. Examples include `heroku plugins` or `heroku commands`. This logic must be in Go since it's what actually sets up and runs the Node code.
* Update logic. All autoupdates are handled in Go and the plugins get autoupdated simply by having a newer version on the npm server.
* Help code. The help is generated in the Go code from the metadata of the plugins.
