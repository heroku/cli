package main

import "bytes"

func Mock() {
	var stderr bytes.Buffer
	var stdout bytes.Buffer
	Stderr = &stderr
	Stdout = &stdout
	exitFn = func(code int) {
		panic(code)
	}
}

func GetMockStderr() string {
	return Stderr.(*bytes.Buffer).String()
}

func GetMockStdout() string {
	return Stdout.(*bytes.Buffer).String()
}
