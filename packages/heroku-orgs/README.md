[![npm version](https://badge.fury.io/js/heroku-access.svg)](http://badge.fury.io/js/heroku-access)

Heroku Access Plugin for Heroku Toolbelt 4.0
===========

Read more about Toolbelt 4.0 plugins [here](https://github.com/heroku/heroku-hello-world#heroku-hello-world).


How to install this plugin
-------------------

**Note: These Node.js plugins are available in the current Ruby CLI. No need to download a separate Toolbelt 4.0 CLI.**

```
$ heroku plugins:install heroku-access
```

### [Using App Privileges in Heroku Organizations](https://devcenter.heroku.com/articles/app-privileges-beta-in-heroku-organizations)

```bash
$ heroku access --app APP_NAME
```

*e.g. (personal app):*

```bash
$ heroku access --app atleti
ortega@atleti.com       collaborator
simeone@atleti.com      owner
```

*e.g. (org app):*

```bash
$ heroku access --app atleti
monoburgos@atleti.com   member
ortega@atleti.com       collaborator
simeone@atleti.com      admin
```

*e.g. (org app with new beta feature):*

```bash
$ heroku access --app atleti
monoburgos@atleti.com   deploy,operate,view
ortega@atleti.com       operate,view
simeone@atleti.com      deploy,manage,operate,view
```

#### Adding new collaborators


```bash
$ heroku access:add user@email.com --app APP
```


```bash
$ heroku access:add user@email.com --app APP --privileges deploy,manage,view,operate
```

#### Updating privileges

```bash
$ heroku access:update user@email.com --app APP --privileges deploy,manage,view,operate # This feature is in BETA
```

#### Removing collaborators

```bash
$ heroku access:remove user@email.com --app APP
```
