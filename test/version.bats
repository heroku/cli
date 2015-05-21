#!/usr/bin/env bats

@test "outputs the right version" {
  run heroku-cli version
  [ $status -eq 0 ]
  [[ ${lines[0]} =~ "heroku-cli/dev" ]]
}
