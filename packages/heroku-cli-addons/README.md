# heroku-cli-addons

This re-implements the `heroku addons [--app APP|--all]` command in Node with a
new UX which aims to make the concepts clearer and the relationships between
them more accessible.

> Note: the commands are in the `_addons` namespace to avoid conflicting with
> the regular `addons` namespace until completed.

Some effort is made to be consistent with mock-ups and designs targeted to 
Dashboard. For example, [these from @almonk](https://trello.com/c/D5UTM7ls/78-redesign-shareable-add-ons-in-dashboard):

![dashboard mock up](https://trello-attachments.s3.amazonaws.com/557e42f469477d59fd7a2a8f/2024x1068/6c3b22a1ad76fabc2a1c54cc23072092/Screen_Shot_2015-06-14_at_20.23.46.png)

Example output:

``` sh-session
$ heroku _addons -a addons-reports
Add-on                              Plan                              Price
──────────────────────────────────  ────────────────────────────────  ───────────────────────────
flowing-tidily-5466                 heroku-postgresql:kappa           (billed to addons app)
 ├─ support-api::ADDONS_DATABASE
 ├─ ADDONS_DATABASE
 ├─ addons::HEROKU_POSTGRESQL_BLUE
 └─ addons::DATABASE
practicing-nobly-1495               heroku-postgresql:premium-yanari  $200/month
 ├─ DATABASE
 ├─ addons::ADDONS_REPORTS
 └─ HEROKU_POSTGRESQL_SILVER
swimming-truly-2371                 openredis:micro                   $8/month
 └─ OPENREDIS
cooling-avidly-8928                 ?                                 (billed to vault-usage app)
 └─ VAULT_USAGE

```

As an experiment, it also makes use of ANSI colours where appropriate, by highlighting
reference types by consistent colours and dimming non-critical information:

![colour example](http://uploads.bjeanes.com/monosnap/Terminal__zsh__14886_2015-08-17_18-35-12.png)

## Install

For now, since this isn't published on `npm`, you can install it like so:

``` sh-session
$ git clone https://github.com/heroku/heroku-cli-addons.git heroku-cli-addons
$ cd heroku-cli-addons
$ npm install                # dependencies
$ heroku plugins:link
```

If you run into any problems, open an issue. You can remove the plugin in the
meantime if it's borked:

``` sh-session
$ rm ~/.heroku/node_modules/heroku-cli-addons
```
