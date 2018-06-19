#!/usr/bin/env bats

setup() {
  run heroku plugins:link .
}

@test "version" {
  run heroku local:version
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "2.0" ]]
}
