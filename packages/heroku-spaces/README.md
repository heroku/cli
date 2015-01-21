# heroku-spaces

Create apps in Dogwood spaces.

## Installation

    $ heroku plugins:install https://github.com/heroku/heroku-spaces.git

## Basic Usage

    $ heroku spaces:create trapezia --org nasa
    $ heroku dapps:create protostar --space trapezia

## Commands

### Spaces

#### Create

    $ heroku spaces:create trapezia --org nasa
    Creating space trapezia in organization nasa... done
    === trapezia
    Organization: nasa
    State:        allocating

#### Info

    $ heroku spaces:info --space trapezia
    === trapezia
    Organization: nasa
    State:        allocating

#### List

    $ heroku spaces
    === Spaces
    Name      Organization   State
    trapezia  nasa           allocating
    galaxy    roscosmos      allocated

#### Rename

    $ heroku spaces:rename nebula --space trapezia
    Renaming space trapezia to nebula... done
    
#### Destroy

    $ heroku spaces:destroy --space trapezia
    Destroying space trapezia... done
    === trapezia
    Organization: nasa
    State:        deleting

### Dogwood Apps

Calling this command `dapps` instead of adding to `apps` to avoid brittle monkey patching in this prototype.
Once this is merged into the main CLI, `--spaces` would just be part of the `apps` command.

#### Create

    $ heroku dapps:create protostar --space trapezia
    Creating protostar in space trapezia... done, stack is cedar-14
    https://protostar.herokuapp.com/ | https://git.heroku.com/protostar.git
    Git remote heroku added

#### Info

    $ heroku dapps:info --app protostar
    === protostar
    Dynos:         1
    Git URL:       https://git.heroku.com/protostar.git
    Owner:         nasa
    Region:        us
    Stack:         cedar-14
    Space:         trapezia
    Web URL:       https://protostar.herokuapp.com/
    Workers:       0
