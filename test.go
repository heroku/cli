package main

import "bytes"

func mock() {
	var stderr bytes.Buffer
	var stdout bytes.Buffer
	Stderr = &stderr
	Stdout = &stdout
	exitFn = func(code int) {
		panic(code)
	}
}

func getMockStderr() string {
	return Stderr.(*bytes.Buffer).String()
}

func getMockStdout() string {
	return Stdout.(*bytes.Buffer).String()
}
