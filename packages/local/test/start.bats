#!/usr/bin/env bats

@test "start" {
  run ./bin/run local web
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works (web)!" ]]
}

@test "start includes just web & worker" {
  run ./bin/run local
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works (web)!" ]] && [[ "$output" =~ "it works (worker)!" ]] && [[ ! "$output" =~ "it works (release)!" ]]
}

@test "start -f Procfile.test includes just web & worker & test" {
  run ./bin/run local -f Procfile.test
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works (web)!" ]] && [[ "$output" =~ "it works (worker)!" ]] && [[ "$output" =~ "it works (test)!" ]] && [[ ! "$output" =~ "it works (release)!" ]]
}

@test "start release includes release" {
  run ./bin/run local release
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works (release)!" ]]
}
