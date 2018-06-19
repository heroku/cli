#!/usr/bin/env bats

setup() {
  run ../../bin/run plugins:link .
}

@test "version" {
  run ../../bin/run local:version
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "2.0" ]]
}
