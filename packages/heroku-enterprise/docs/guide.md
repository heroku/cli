# Using Heroku Enterprise

Heroku Enterprise accounts provide a new container for managing account members,
teams, and consolidated usage. Enterprise accounts have an account-level 
permission called `manage` that allows a person granted that permission the 
ability to manage permissions for other account members.

## Getting Started

Make sure you have the `heroku-enterprise` plugin installed:

```sh
heroku plugins:install heroku-enterprise
```

## Creating an Account

To begin, you need a Heroku Enterprise account. To create an enterprise account,
you need to provide the name of the account and a list of managers for the 
 account. **sudo is required** to create an enterprise account.

As an example, if your account is "acme" and you want to set Naaman as the 
account's manager, you can create that account with the following command:

```sh
$ heroku sudo enterprises:create acme --managers naaman@heroku.com
```

## Managing Members

Now that you have an account, you can manage members in the account with the
`enterprises:members` set of commands. Management of members is pretty 
straightforward and similar to managing team members; you can add, update, and
delete members along with their associated permissions.

#### Adding Members

To add a new member, you must provide that person's email address, the set of
permissions you'd like to grant, and the enterprise account name. The following
adds Kathy to the acme enterprise account:

```sh
$ heroku enterprises:members-add kath@heroku.com --permissions billing --enterprise-account acme
Adding kath@heroku.com to acme... done
```

#### Listing Members

Listing members just needs the name of the enterprise account.

```sh
$ heroku enterprises:members --enterprise-account acme
naaman@heroku.com  billing,manage
kath@heroku.com    billing
```

#### Removing a Member

To remove a member, you must provide the user's email and the enterprise account
name. The following removes Kathy from the acme enterprise account.

```sh
$ heroku enterprises:members-remove kath@heroku.com --enterprise-account acme
Removing kath@heroku.com to acme... done
```

## Managing Teams

Managing teams in an enterprise account is currently limited. You can see which
teams are part of an enterprise account and you can transfer a team into an 
enterprise account.

#### Listing Teams

```sh
$ heroku teams
Team                                 Enterprise Account
───────────────────────────────────  ──────────────────
acme-web                             n/a
acme-api                             n/a
```

#### Creating Teams

To create a team in an enterprise account, you must specify the team name you
 want and the enterprise account name. The team name must be unique. You will be
 assigned as the sole admin of the team.

```sh
$ heroku teams:create acme-data --enterprise-account acme
Creating acme-data in acme... done
Creating acme-data in acme... done
```

#### Transferring a Team

To transfer a team, you must specify the team name and the enterprise account
name. The following transfers the acme-web team into the acme enterprise 
account:

```sh
$ heroku teams:transfer acme-web --enterprise-account acme
Transferring acme-web to acme... done
```

#### After Transferring Teams

Once teams are transferred into an enterprise account, you can see that the team
now includes the enterprise account when listing teams.

```
$ heroku teams
Team                                 Enterprise Account
───────────────────────────────────  ──────────────────
acme-web                             acme
acme-api                             acme
```

## Usage

Once teams are setup, usage can be reviewed for an enterprise account by 
providing the name of the account. The following displays the usage for the
acme account:

```
$ heroku enterprises:usage --enterprise-account acme
Account         Team              App                   Addon Usage  Connect Usage  Data Usage  Dyno Usage  Partner Usage
──────────────  ────────────────  ────────────────────  ───────────  ─────────────  ──────────  ──────────  ─────────────
acme            acme-web          acme-web-ui           0            0              0           0.516       0
acme            acme-web          acme-web-cache        465          0              465         0           0
acme            acme-web          acme-web-assets       0            0              0           0.516       0
acme            acmd-api          acme-api-core         0            0              0           0.516       0
acme            acmd-api          acme-api-jobs         0            0              0           0.516       0
```
