package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// Used to mock stdout for testing
var Stdout os.Stdout

// Used to mock stderr for testing
var Stderr os.Stderr

var logger = newLogger(AppDir + "/cli.log")
var exitFn = os.Exit
var debugging = isDebugging()

func newLogger(path string) *log.Logger {
	err := os.MkdirAll(filepath.Dir(path), 0777)
	must(err)
	file, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	must(err)
	return log.New(file, "", log.LstdFlags)
}

// Exit just calls os.Exit, but can be mocked out for testing
func Exit(code int) {
	exitFn(code)
}

// Err just calls `fmt.Fprint(Stderr, a...)` but can be mocked out for testing.
func Err(a ...interface{}) {
	logger.Print(a...)
	fmt.Fprint(Stderr, a...)
}

// Errf just calls `fmt.Fprintf(Stderr, a...)` but can be mocked out for testing.
func Errf(format string, a ...interface{}) {
	logger.Printf(format, a...)
	fmt.Fprintf(Stderr, format, a...)
}

// Errln just calls `fmt.Fprintln(Stderr, a...)` but can be mocked out for testing.
func Errln(a ...interface{}) {
	logger.Println(a...)
	fmt.Fprintln(Stderr, a...)
}

// Print is used to replace `fmt.Print()` but can be mocked out for testing.
func Print(a ...interface{}) {
	logger.Print(a...)
	fmt.Fprint(Stdout, a...)
}

// Printf is used to replace `fmt.Printf()` but can be mocked out for testing.
func Printf(format string, a ...interface{}) {
	logger.Printf(format, a...)
	fmt.Fprintf(Stdout, format, a...)
}

// Println is used to replace `fmt.Println()` but can be mocked out for testing.
func Println(a ...interface{}) {
	logger.Println(a...)
	fmt.Fprintln(Stdout, a...)
}

// Logln is used to print debugging information
// It will be added to the logfile in ~/.heroku or printed out if HEROKU_DEBUG is set.
func Logln(a ...interface{}) {
	logger.Println(a...)
	if debugging {
		fmt.Fprintln(Stderr, a...)
	}
}

// Logf is used to print debugging information
// It will be added to the logfile in ~/.heroku or printed out if HEROKU_DEBUG is set.
func Logf(format string, a ...interface{}) {
	logger.Printf(format, a...)
	if debugging {
		fmt.Fprintf(Stderr, format, a...)
	}
}

func isDebugging() bool {
	debug := strings.ToUpper(os.Getenv("HEROKU_DEBUG"))
	if debug == "TRUE" || debug == "1" {
		return true
	}
	return false
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}
