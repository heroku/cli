# Heroku OAuth [![CircleCI](https://circleci.com/gh/heroku/heroku-cli-oauth.svg?style=svg)](https://circleci.com/gh/heroku/heroku-cli-oauth)
[![Code Climate](https://codeclimate.com/github/heroku/heroku-cli-oauth/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-cli-oauth)
[![codecov](https://codecov.io/gh/heroku/heroku-cli-oauth/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-cli-oauth)
[![npm version](https://badge.fury.io/js/heroku-cli-oauth.svg)](https://badge.fury.io/js/heroku-cli-oauth)
[![License](https://img.shields.io/github/license/heroku/heroku-cli-oauth.svg)](https://github.com/heroku/heroku-cli-oauth/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Command line plugin for managing OAuth clients, authorizations and tokens.

No need to install, this plugin comes built into the Heroku CLI.

### Clients

To create a client:

``` bash
$ heroku clients:create "Amazing" https://amazing-client.herokuapp.com/auth/heroku/callback
Creating Amazing... done
HEROKU_OAUTH_ID=3e304bda-d376-4278-bdea-6d6c08aa1359
HEROKU_OAUTH_SECRET=e6a5f58f-f8a9-49f1-a1a6-d1dd98930ef6
```

See OAuth clients under your account with:

``` bash
$ heroku clients
Amazing  3e304bda-d376-4278-bdea-6d6c08aa1359  https://amazing-client.herokuapp.com/auth/heroku/callback
```

Get details about a client:
```bash
$ heroku clients:info 36120128-fee7-455e-8b7f-807aee130946
=== Amazing
created_at:         2016-01-21T02:11:57Z
id:                 36120128-fee7-455e-8b7f-807aee130946
name:               Amazing
redirect_uri:       https://amazing-client.herokuapp.com/auth/heroku/callback
secret:             a14cf558-60b8-44f2-a804-3b249b48aa57
updated_at:         2016-01-21T02:11:57Z
```

Update clients:

``` bash
$ heroku clients:update 3e304bda-d376-4278-bdea-6d6c08aa1359 --url https://amazing-client.herokuapp.com/auth/heroku/callback
Updated Amazing... done
```

### Authorizations

List them:

``` bash
$ heroku authorizations
Amazing                        9e3a4063-b833-432e-ad75-4b0d7195be13  global
Heroku CLI                     676cb46c-7597-4be1-8a6a-f87b9f2f1065  global
```

#### Creating

You can create a special user-created authorization against your account that will come with an access token which doesn't expire:

``` bash
$ heroku authorizations:create --description "For use with Anvil"
Created OAuth authorization.
  ID:          105a7bfa-34c3-476e-873a-b1ac3fdc12fb
  Description: For use with Anvil
  Token:       4cee516c-f8c6-4f14-9edf-fc6ef09cedc5
  Scope:       global
```

You can also pass in short output format to only output the token.

```bash
$ heroku authorizations:create --output-format short
nec6a9b6-b21a-4ba1-il95-70zd47e14c4d
```

Another option allows for tokens that expire.  This token expires in 10 seconds.
```
$ heroku authorizations:create --expires-in 10
Created OAuth authorization.
  Client:      <none>
  ID:          2231biha6-5b1e-4268-ba04-2ee7b74m2gf6
  Description: Long-lived user authorization
  Scope:       global
  Token:       9aa5d667-fg37-4028-8dc9-b2191b5z5966
```

A combination of short format and expires-in can be handy to pass into a job that needs access to heroku:

``` bash
$ heroku run "HEROKU_EMAIL=`heroku auth:whoami` HEROKU_API_KEY=`heroku authorizations:create --expires-in 120 --output-format short` ./my_job.sh" -a myapp
```


Optionally, you can specify a list of scopes for the authorization:

``` bash
$ heroku authorizations:create --description "For use with Anvil" --scope identity,read-protected
Created OAuth authorization.
  ID:          105a7bfa-34c3-476e-873a-b1ac3fdc12fb
  Description: For use with Anvil
  Token:       4cee516c-f8c6-4f14-9edf-fc6ef09cedc5
  Scope:       identity, read-protected
```

The procured token can now be used like an API key:

``` bash
$ curl -u ":4cee516c-f8c6-4f14-9edf-fc6ef09cedc5" https://api.heroku.com/apps
```


#### Revoking

Any authorization on your account can be revoked at any time:

``` bash
$ heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb
Revoked authorization from "Another App".
```
