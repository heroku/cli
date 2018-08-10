#!/usr/bin/env bats

@test "version" {
  run ../../bin/run local:version
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "2.0" ]]
}
