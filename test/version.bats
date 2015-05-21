#!/usr/bin/env bats

@test "outputs the right version" {
  skip "fix this on circleci"
  run ./heroku-cli version
  [ $status -eq 0 ]
  [[ ${lines[0]} =~ "heroku-cli/dev" ]]
}
