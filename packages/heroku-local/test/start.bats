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

@test "start includes just web & worker" {
  run heroku local
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works (web)!" ]] && [[ "$output" =~ "it works (worker)!" ]] && [[ ! "$output" =~ "it works (release)!" ]]
}

@test "start -f Procfile.test includes just web & worker & test" {
  run heroku local -f Procfile.test
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works (web)!" ]] && [[ "$output" =~ "it works (worker)!" ]] && [[ "$output" =~ "it works (test)!" ]] && [[ ! "$output" =~ "it works (release)!" ]]
}

@test "start release includes release" {
  run heroku local release
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works (release)!" ]]
}
