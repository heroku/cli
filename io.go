package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"strings"
	"sync"

	"github.com/lunixbochs/vtclean"
	rollbarAPI "github.com/stvp/rollbar"
	"golang.org/x/crypto/ssh/terminal"
)

// Stdout is used to mock stdout for testing
var Stdout io.Writer

// Stderr is to mock stderr for testing
var Stderr io.Writer

// ErrLogPath is the location of the error log
var ErrLogPath = filepath.Join(AppDir(), "error.log")
var errLogger = newLogger(ErrLogPath)
var exitFn = os.Exit
var debugging = isDebugging()
var debuggingHeaders = isDebuggingHeaders()
var swallowSigint = false
var errorPrefix = ""
var wg sync.WaitGroup

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
	currentAnalyticsCommand.RecordEnd(code)
	showCursor()
	wg.Wait()
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
	errLogger.Print(vtclean.Clean(fmt.Sprint(a...), false))
}

// Logln is used to print debugging information
// It will be added to the logfile in ~/.heroku
func Logln(a ...interface{}) {
	Log(fmt.Sprintln(a...))
}

// Logf is used to print debugging information
// It will be added to the logfile in ~/.heroku
func Logf(format string, a ...interface{}) {
	Log(fmt.Sprintf(format, a...))
}

// Debugln is used to print debugging information
// It will be added to the logfile in ~/.heroku and stderr if HEROKU_DEBUG is set.
func Debugln(a ...interface{}) {
	Logln(a...)
	if debugging {
		fmt.Fprintln(Stderr, a...)
	}
}

// Debugf is used to print debugging information
// It will be added to the logfile in ~/.heroku and stderr if HEROKU_DEBUG is set.
func Debugf(f string, a ...interface{}) {
	Logf(f, a...)
	if debugging {
		fmt.Fprintf(Stderr, f, a...)
	}
}

// PrintError is a helper that prints out formatted error messages in red text
func PrintError(e error) {
	if e == nil {
		return
	}
	Err(errorPrefix)
	Error(e.Error())
	Logln(string(debug.Stack()))
	rollbar(e)
	if debugging {
		debug.PrintStack()
	}
}

// Warn shows a message with excalamation points prepended to stderr
func Warn(msg string) {
	bang := yellow(" ▸    ")
	msg = strings.TrimSpace(msg)
	msg = strings.Join(strings.Split(msg, "\n"), "\n"+bang)
	Errln(bang + msg)
}

// Error shows a message with excalamation points prepended to stderr
func Error(msg string) {
	bang := red(" " + errorArrow() + "    ")
	msg = strings.TrimSpace(msg)
	msg = strings.Join(strings.Split(msg, "\n"), "\n"+bang)
	Errln(bang + msg)
}

// ExitWithMessage shows an error message then exits with status code 2
// It does not emit to rollbar
func ExitWithMessage(format string, a ...interface{}) {
	Error(fmt.Sprintf(format, a...))
	Exit(2)
}

func errorArrow() string {
	if windows() {
		return "!"
	}
	return "▸"
}

// ExitIfError calls PrintError and exits if e is not null
func ExitIfError(e error) {
	if e != nil {
		PrintError(e)
		Exit(1)
	}
}

// LogIfError logs out an error if one arises
func LogIfError(e error) {
	if e != nil {
		Logln(e.Error())
		Logln(string(debug.Stack()))
	}
}

func isDebugging() bool {
	debug := strings.ToUpper(os.Getenv("HEROKU_DEBUG"))
	if debug == "TRUE" || debug == "1" {
		return true
	}
	return false
}

func isDebuggingHeaders() bool {
	debug := strings.ToUpper(os.Getenv("HEROKU_DEBUG_HEADERS"))
	if debug == "TRUE" || debug == "1" {
		return true
	}
	return false
}

func yellow(s string) string {
	if supportsColor() && !windows() {
		return "\x1b[33m" + s + "\x1b[39m"
	}
	return s
}

func red(s string) string {
	if supportsColor() && !windows() {
		return "\x1b[31m" + s + "\x1b[39m"
	}
	return s
}

func green(s string) string {
	if supportsColor() && !windows() {
		return "\x1b[32m" + s + "\x1b[39m"
	}
	return s
}

func cyan(s string) string {
	if supportsColor() && !windows() {
		return "\x1b[36m" + s + "\x1b[39m"
	}
	return s
}

func windows() bool {
	return runtime.GOOS == "windows"
}

func istty() bool {
	return terminal.IsTerminal(int(os.Stdout.Fd()))
}

func supportsColor() bool {
	if !istty() {
		return false
	}
	for _, arg := range os.Args {
		if arg == "--no-color" {
			return false
		}
	}
	return os.Getenv("COLOR") != "false"
}

func plural(word string, count int) string {
	if count == 1 {
		return word
	}
	return word + "s"
}

func showCursor() {
	if supportsColor() && !windows() {
		Print("\u001b[?25h")
	}
}

func hideCursor() {
	if supportsColor() && !windows() {
		Print("\u001b[?25l")
	}
}

func action(text, done string, fn func()) {
	Err(text + "...")
	errorPrefix = red(" !") + "\n"
	hideCursor()
	fn()
	showCursor()
	errorPrefix = ""
	if done != "" {
		Errln(" " + done)
	}
}

func handleSignal(s os.Signal, fn func()) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, s)
	go func() {
		<-c
		fn()
	}()
}

func rollbar(err error) {
	wg.Add(1)
	go func() {
		defer wg.Done()
		rollbarAPI.Platform = "client"
		rollbarAPI.Token = "b40226d5e8a743cf963ca320f7be17bd"
		rollbarAPI.Environment = Channel
		rollbarAPI.ErrorWriter = nil
		var cmd string
		if len(os.Args) > 1 {
			cmd = os.Args[1]
		}
		fields := []*rollbarAPI.Field{
			{"version", Version},
			{"os", runtime.GOOS},
			{"arch", runtime.GOARCH},
			{"command", cmd},
			{"user", netrcLogin()},
		}
		rollbarAPI.Error(rollbarAPI.ERR, err, fields...)
		rollbarAPI.Wait()
	}()
}
