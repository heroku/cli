package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
)

var logger = newLogger(AppDir + "/plugins.log")
var Stdout io.Writer = os.Stdout
var Stderr io.Writer = os.Stderr
var exitFn = os.Exit
var debugging = isDebugging()

func newLogger(path string) *log.Logger {
	err := os.MkdirAll(filepath.Dir(path), 0777)
	must(err)
	file, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	must(err)
	return log.New(file, "", log.LstdFlags)
}

func Exit(code int) {
	exitFn(code)
}

func Err(a ...interface{}) {
	logger.Print(a...)
	fmt.Fprint(Stderr, a...)
}

func Errf(format string, a ...interface{}) {
	logger.Printf(format, a...)
	fmt.Fprintf(Stderr, format, a...)
}

func Errln(a ...interface{}) {
	logger.Println(a...)
	fmt.Fprintln(Stderr, a...)
}

func Print(a ...interface{}) {
	logger.Print(a...)
	fmt.Fprint(Stdout, a...)
}

func Printf(format string, a ...interface{}) {
	logger.Printf(format, a...)
	fmt.Fprintf(Stdout, format, a...)
}

func Println(a ...interface{}) {
	logger.Println(a...)
	fmt.Fprintln(Stdout, a...)
}

func Logln(a ...interface{}) {
	logger.Println(a...)
	if debugging {
		fmt.Fprintln(Stderr, a...)
	}
}

func Logf(format string, a ...interface{}) {
	logger.Printf(format, a...)
	if debugging {
		fmt.Fprintf(Stderr, format, a...)
	}
}

func isDebugging() bool {
	debug := strings.ToUpper(os.Getenv("DEBUG"))
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
