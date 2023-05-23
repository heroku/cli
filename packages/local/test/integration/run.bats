#!/usr/bin/env bats

@test "run" {
  run ./bin/run local:run echo 'it works!'
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "it works!" ]]
}

@test "run propagates exit 1" {
  run ./bin/run local:run exit 1
  [ "$status" -eq 1 ]
}
