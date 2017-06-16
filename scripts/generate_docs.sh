#!/usr/bin/env bash

heroku-plugin-readme-generator > /tmp/heroku-cli-commands.md
devcenter push /tmp/heroku-cli-commands.md
