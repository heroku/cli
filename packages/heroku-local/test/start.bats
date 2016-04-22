#!/usr/bin/env bats

setup() {
  run heroku plugins:link .
}

@test "start" {
  run heroku local web
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works (web)!" ]]
}
