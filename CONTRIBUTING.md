Contributing to the Heroku CLI
==============================

The Heroku CLI is written in Go with Node modules. For more on the v4 architecture, [check out the README](https://github.com/heroku/cli/blob/master/README.md).

Commands can be written either in Go or as a Node module. Generally speaking if you want to contribute a new command it should be done in a Node module because these modules are easier to write and we have established good testing strategies for them. There are some exceptions to changes that would need to be in Go:

The exception to this are core commands that only make sense to be in the core like `heroku plugins:install` or `heroku help`. Previously we also wanted authentication logic to be in the core as well, but a newer project goal is now to make the CLI more general purpose to be used in other non-Heroku contexts. Keeping Heroku-specific logic out of the CLI will be necessary for us to meet that goal.
