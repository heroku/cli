package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/mgutz/ansi"
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
var red = ansi.ColorFunc("red")

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
	errLogger.Print(a...)
	fmt.Fprint(Stderr, a...)
}

// Errf just calls `fmt.Fprintf(Stderr, a...)` but can be mocked out for testing.
func Errf(format string, a ...interface{}) {
	errLogger.Printf(format, a...)
	fmt.Fprintf(Stderr, format, a...)
}

// Errln just calls `fmt.Fprintln(Stderr, a...)` but can be mocked out for testing.
func Errln(a ...interface{}) {
	errLogger.Println(a...)
	fmt.Fprintln(Stderr, a...)
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
	if debugging {
		fmt.Fprint(Stderr, a...)
	}
}

// Logln is used to print debugging information
// It will be added to the logfile in ~/.heroku or printed out if HEROKU_DEBUG is set.
func Logln(a ...interface{}) {
	errLogger.Println(a...)
	if debugging {
		fmt.Fprintln(Stderr, a...)
	}
}

// Logf is used to print debugging information
// It will be added to the logfile in ~/.heroku or printed out if HEROKU_DEBUG is set.
func Logf(format string, a ...interface{}) {
	errLogger.Printf(format, a...)
	if debugging {
		fmt.Fprintf(Stderr, format, a...)
	}
}

// PrintError is a helper that prints out formatted error messages in red text
func PrintError(e error) {
	Errln(red(" !   "), red(e.Error()))
}

func isDebugging() bool {
	debug := strings.ToUpper(os.Getenv("HEROKU_DEBUG"))
	if debug == "TRUE" || debug == "1" {
		return true
	}
	return false
}
