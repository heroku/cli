package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// Used to mock stdout for testing
var Stdout io.Writer

// Used to mock stderr for testing
var Stderr io.Writer

// ErrLogPath is the location of the error log
var ErrLogPath = filepath.Join(AppDir, "error.log")
var errLogger = newLogger(ErrLogPath)
var exitFn = os.Exit
var debugging = isDebugging()

func init() {
	Stdout = os.Stdout
	Stderr = os.Stderr
}

func newLogger(path string) *log.Logger {
	err := os.MkdirAll(filepath.Dir(path), 0777)
	if err != nil {
		panic(err)
	}
	file, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		panic(err)
	}
	return log.New(file, "", log.LstdFlags)
}

// Exit just calls os.Exit, but can be mocked out for testing
func Exit(code int) {
	exitFn(code)
}

// Err just calls `fmt.Fprint(Stderr, a...)` but can be mocked out for testing.
func Err(a ...interface{}) {
	fmt.Fprint(Stderr, a...)
	Log(a...)
}

// Errf just calls `fmt.Fprintf(Stderr, a...)` but can be mocked out for testing.
func Errf(format string, a ...interface{}) {
	fmt.Fprintf(Stderr, format, a...)
	Logf(format, a...)
}

// Errln just calls `fmt.Fprintln(Stderr, a...)` but can be mocked out for testing.
func Errln(a ...interface{}) {
	fmt.Fprintln(Stderr, a...)
	Logln(a...)
}

// Print is used to replace `fmt.Print()` but can be mocked out for testing.
func Print(a ...interface{}) {
	fmt.Fprint(Stdout, a...)
}

// Printf is used to replace `fmt.Printf()` but can be mocked out for testing.
func Printf(format string, a ...interface{}) {
	fmt.Fprintf(Stdout, format, a...)
}

// Println is used to replace `fmt.Println()` but can be mocked out for testing.
func Println(a ...interface{}) {
	fmt.Fprintln(Stdout, a...)
}

// Log is used to print debugging information
// It will be added to the logfile in ~/.heroku or printed out if HEROKU_DEBUG is set.
func Log(a ...interface{}) {
	errLogger.Print(a...)
}

// Logln is used to print debugging information
// It will be added to the logfile in ~/.heroku
func Logln(a ...interface{}) {
	errLogger.Println(a...)
}

// Logf is used to print debugging information
// It will be added to the logfile in ~/.heroku
func Logf(format string, a ...interface{}) {
	errLogger.Printf(format, a...)
}

// Debugln is used to print debugging information
// It will be added to the logfile in ~/.heroku and stderr if HEROKU_DEBUG is set.
func Debugln(a ...interface{}) {
	Logln(a...)
	if debugging {
		fmt.Fprintln(Stderr, a...)
	}
}

// PrintError is a helper that prints out formatted error messages in red text
func PrintError(e error) {
	Warn(e.Error())
}

func Warn(msg string) {
	bang := " !   "
	msg = strings.TrimSpace(msg)
	msg = strings.Join(strings.Split(msg, "\n"), "\n"+bang)
	Errln(bang + msg)
}

// ExitIfError calls PrintError and exits if e is not null
func ExitIfError(e error) {
	if e != nil {
		PrintError(e)
		os.Exit(1)
	}
}

func isDebugging() bool {
	debug := strings.ToUpper(os.Getenv("HEROKU_DEBUG"))
	if debug == "TRUE" || debug == "1" {
		return true
	}
	return false
}
