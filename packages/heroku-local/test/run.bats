#!/usr/bin/env bats

setup() {
  run heroku plugins:link .
}

@test "run" {
  run heroku local:run echo 'it works!'
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works!" ]]
}

@test "run propagates exit 1" {
  run heroku local:run exit 1
  [ "$status" -eq 1 ]
}
