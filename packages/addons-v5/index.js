/* eslint-disable unicorn/prefer-array-flat */
'use strict'

const _ = require('lodash')

exports.topic = {
  name: 'addons',
  description: 'tools and services for developing, extending, and operating your app',
  overview: `Overview of Add-ons:

  Add-ons are created with the \`addons:create\` command, providing a reference
  to an add-on service (such as \`heroku-postgresql\`) or a service and plan
  (such as \`heroku-postgresql:mini\`).

  At creation, each add-on is given a globally unique name. In addition, each
  add-on has at least one attachment alias to each application which uses the
  add-on. In all cases, the owning application will be attached to the add-on.
  An attachment alias is unique to its application, and is used as a prefix to
  any environment variables it exports to the application.

  In this example, a \`heroku-postgresql\` add-on is created and its given name
  is \`postgresql-deep-6913\` with a default attachment alias of \`DATABASE\`:

    $ heroku addons:create heroku-postgresql --app my-app
    Creating postgresql-deep-6913... done, (mini)
    Adding postgresql-deep-6913 to my-app... done
    Setting DATABASE_URL and restarting my-app... done, v5
    Database has been created and is available

    $ heroku addons --app my-app
    Add-on                                     Plan  Price
    ─────────────────────────────────────────  ────  ────────
    heroku-postgresql (postgresql-deep-6913)   mini  $5/month
    └─ as DATABASE

  The add-on name and, in some cases, the attachment alias can be specified by
  the user. For instance, we can add a second database to the app, specifying
  both these identifiers:

    $ heroku addons:create heroku-postgresql --app my-app --name main-db --as PRIMARY_DB
    Creating main-db... done, ($5/month)
    Adding main-db to my-app... done
    Setting PRIMARY_DB_URL and restarting my-app... done, v6
    Database has been created and is available

    $ heroku addons --app my-app
    Add-on                                     Plan  Price
    ─────────────────────────────────────────  ────  ────────
    heroku-postgresql (main-db)                mini  $5/month
    └─ as PRIMARY_DB

    heroku-postgresql (postgresql-deep-6913)   mini  $5/month
    └─ as DATABASE

  Attachment aliases can also be specified when making attachments:

    $ heroku addons:attach main-db --app my-app --as ANOTHER_NAME
    Attaching main-db as ANOTHER_NAME to my-app... done
    Setting ANOTHER_NAME vars and restarting my-app... done, v7

    $ heroku addons --app my-app
    Add-on                                     Plan  Price
    ─────────────────────────────────────────  ────  ────────
    heroku-postgresql (main-db)                mini  $5/month
    ├─ as PRIMARY_DB
    └─ as ANOTHER_NAME

    heroku-postgresql (postgresql-deep-6913)   mini  $5/month
    └─ as DATABASE

  For more information, read https://devcenter.heroku.com/articles/add-ons`,
}

exports.commands = _.flatten([
  require('./commands/addons'),
  require('./commands/addons/create'),
  require('./commands/addons/destroy'),
  require('./commands/addons/docs'),
  require('./commands/addons/info'),
  require('./commands/addons/open'),
  require('./commands/addons/plans'),
  require('./commands/addons/rename'),
  require('./commands/addons/services'),
  require('./commands/addons/upgrade'),
  require('./commands/addons/wait'),
])

exports.resolve = require('./lib/resolve')
exports.createAddon = require('./lib/create_addon')
exports.destroyAddon = require('./lib/destroy_addon')
