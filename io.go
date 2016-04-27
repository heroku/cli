package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"strings"
	"syscall"

	"github.com/ansel1/merry"
	"github.com/lunixbochs/vtclean"
	rollbarAPI "github.com/stvp/rollbar"
	"golang.org/x/crypto/ssh/terminal"
)

// Stdout is used to mock stdout for testing
var Stdout io.Writer = os.Stdout

// Stderr is to mock stderr for testing
var Stderr io.Writer = os.Stderr

// InspectOut is used to mock inspect for testing
var InspectOut io.Writer = os.Stderr

var errLogger = newLogger(ErrLogPath)

// ExitFn is used to mock os.Exit
var ExitFn = os.Exit
var debugging = isDebugging()
var debuggingHeaders = isDebuggingHeaders()
var swallowSigint = false

func newLogger(path string) *log.Logger {
	err := os.MkdirAll(filepath.Dir(path), 0777)
	must(err)
	file, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	must(err)
	return log.New(file, "", log.LstdFlags)
}

// Exit just calls os.Exit, but can be mocked out for testing
func Exit(code int) {
	TriggerBackgroundUpdate()
	currentAnalyticsCommand.RecordEnd(code)
	showCursor()
	ExitFn(code)
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
// It will be added to the logfile in ~/.cache/heroku/error.log or printed out if HEROKU_DEBUG is set.
func Log(a ...interface{}) {
	errLogger.Print(vtclean.Clean(fmt.Sprint(a...), false))
}

// Logln is used to print debugging information
// It will be added to the logfile in ~/.cache/heroku/error.log
func Logln(a ...interface{}) {
	Log(fmt.Sprintln(a...))
}

// Logf is used to print debugging information
// It will be added to the logfile in ~/.cache/heroku/error.log
func Logf(format string, a ...interface{}) {
	Log(fmt.Sprintf(format, a...))
}

// Debugln is used to print debugging information
// It will be added to the logfile in ~/.cache/heroku/error.log and stderr if HEROKU_DEBUG is set.
func Debugln(a ...interface{}) {
	Logln(a...)
	if debugging {
		fmt.Fprintln(Stderr, a...)
	}
}

// Debugf is used to print debugging information
// It will be added to the logfile in ~/.cache/heroku/error.log and stderr if HEROKU_DEBUG is set.
func Debugf(format string, a ...interface{}) {
	Logf(format, a...)
	if debugging {
		fmt.Fprintf(Stderr, format, a...)
	}
}

// WarnIfError is a helper that prints out formatted error messages
// it will emit to rollbar
// it does not exit
func WarnIfError(err error) {
	if err == nil {
		return
	}
	err = merry.Wrap(err)
	Warn(err.Error())
	Debugln(merry.Details(err))
	rollbar(err, "warning")
}

// Warn shows a message with excalamation points prepended to stderr
func Warn(msg string) {
	if actionMsg != "" {
		Errln(yellow(" !"))
	}
	prefix := " " + yellow(ErrorArrow) + "    "
	msg = strings.TrimSpace(msg)
	msg = strings.Join(strings.Split(msg, "\n"), "\n"+prefix)
	Errln(prefix + msg)
	if actionMsg != "" {
		Err(actionMsg + "...")
	}
}

// Error shows a message with excalamation points prepended to stderr
func Error(msg string) {
	if actionMsg != "" {
		Errln(red(" !"))
	}
	prefix := " " + red(ErrorArrow) + "    "
	msg = strings.TrimSpace(msg)
	msg = strings.Join(strings.Split(msg, "\n"), "\n"+prefix)
	Errln(prefix + msg)
}

// ExitWithMessage shows an error message then exits with status code 2
// It does not emit to rollbar
func ExitWithMessage(format string, a ...interface{}) {
	Error(fmt.Sprintf(format, a...))
	Exit(2)
}

// ErrorArrow is the triangle or bang that prefixes errors
var ErrorArrow = errorArrow()

func errorArrow() string {
	if windows() {
		return "!"
	}
	return "▸"
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}

// LogIfError logs out an error if one arises
func LogIfError(e error) {
	if e != nil {
		Logln(e.Error())
		Logln(string(debug.Stack()))
		rollbar(e, "info")
	}
}

// ONE is the string 1
const ONE = "1"

func isDebugging() bool {
	debug := strings.ToUpper(os.Getenv("HEROKU_DEBUG"))
	if debug == "TRUE" || debug == ONE {
		return true
	}
	return false
}

func isDebuggingHeaders() bool {
	debug := strings.ToUpper(os.Getenv("HEROKU_DEBUG_HEADERS"))
	if debug == "TRUE" || debug == ONE {
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
	return runtime.GOOS == WINDOWS
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
	if config, _ := config.GetBool("color"); config != nil && *config == false {
		return false
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

var actionMsg string

func action(msg, done string, fn func()) {
	actionMsg = msg
	Err(actionMsg + "...")
	hideCursor()
	fn()
	actionMsg = ""
	showCursor()
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

func handlePanic() {
	if crashing {
		// if already crashing just let the error bubble
		// or else potential fork-bomb
		return
	}
	crashing = true
	if rec := recover(); rec != nil {
		err, ok := rec.(error)
		if !ok {
			err = merry.New(rec.(string))
		}
		err = merry.Wrap(err)
		Error(err.Error())
		Debugln(merry.Details(err))
		rollbar(err, "error")
		Exit(1)
	}
}

func rollbar(err error, level string) {
	if os.Getenv("TESTING") == ONE {
		return
	}
	rollbarAPI.Platform = "client"
	rollbarAPI.Token = "b40226d5e8a743cf963ca320f7be17bd"
	rollbarAPI.Environment = Channel
	rollbarAPI.ErrorWriter = nil
	rollbarAPI.CodeVersion = GitSHA
	var cmd string
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}
	fields := []*rollbarAPI.Field{
		{"version", Version},
		{"os", runtime.GOOS},
		{"arch", runtime.GOARCH},
		{"command", cmd},
		{"person.id", netrcLogin()},
	}
	rollbarAPI.Error(level, err, fields...)
	rollbarAPI.Wait()
}

func readJSON(path string) (map[string]interface{}, error) {
	if exists, err := fileExists(path); !exists {
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{}, nil
	}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var out map[string]interface{}
	err = json.Unmarshal(data, &out)
	return out, err
}

func saveJSON(obj interface{}, path string) error {
	data, err := json.MarshalIndent(obj, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(path, data, 0644)
}

// Inspect an object
func Inspect(o interface{}) {
	fmt.Fprintf(InspectOut, "%+v\n", o)
}

func execBin(bin string, args ...string) {
	if runtime.GOOS != WINDOWS {
		cmd := exec.Command(bin, args[1:]...)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err := cmd.Run()
		os.Exit(getExitCode(err))
	} else {
		must(syscall.Exec(bin, args, os.Environ()))
		Inspect("")
	}
}

// truncates the beginning of a file
func truncate(path string, n int) {
	f, err := os.Open(path)
	if err != nil {
		LogIfError(err)
		return
	}
	scanner := bufio.NewScanner(f)
	lines := make([]string, 0, n+1)
	scanner.Split(bufio.ScanLines)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
		if len(lines) > n {
			lines = lines[1:]
		}
	}
	lines = append(lines, "")
	ioutil.WriteFile(path, []byte(strings.Join(lines, "\n")), 0644)
}
