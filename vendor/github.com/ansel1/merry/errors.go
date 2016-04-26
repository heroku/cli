package merry

// The merry package augments standard golang errors with stacktraces
// and other context information.
//
// You can add any context information to an error with `e = merry.WithValue(e, "code", 12345)`
// You can retrieve that value with `v, _ := merry.Value(e, "code").(int)`
//
// Any error augmented like this will automatically get a stacktrace attached, if it doesn't have one
// already.  If you just want to add the stacktrace, use `Wrap(e)`
//
// It also providers a way to override an error's message:
//
//     var InvalidInputs = errors.New("Bad inputs")
//
// `Here()` captures a new stacktrace, and WithMessagef() sets a new error message:
//
//     return merry.Here(InvalidInputs).WithMessagef("Bad inputs: %v", inputs)
//
// Errors are immutable.  All functions and methods which add context return new errors.
// But errors can still be compared to the originals with `Is()`
//
//     if merry.Is(err, InvalidInputs) {
//
// Functions which add context to errors have equivalent methods on *Error, to allow
// convenient chaining:
//
//     return merry.New("Invalid body").WithHTTPCode(400)

import (
	"errors"
	"fmt"
	"runtime"
)

// The maximum number of stackframes on any error.
var MaxStackDepth = 50

type Error interface {
	error
	Appendf(format string, args ...interface{}) Error
	Append(msg string) Error
	Prepend(msg string) Error
	Prependf(format string, args ...interface{}) Error
	WithMessage(msg string) Error
	WithMessagef(format string, args ...interface{}) Error
	WithUserMessage(msg string) Error
	WithUserMessagef(format string, args ...interface{}) Error
	WithValue(key, value interface{}) Error
	Here() Error
	WithStackSkipping(skip int) Error
	WithHTTPCode(code int) Error
}

// Create a new error, with a stack attached.  The equivalent of golang's errors.New()
func New(msg string) Error {
	return WrapSkipping(errors.New(msg), 1)
}

// Create a new error with a formatted message and a stack.  The equivalent of golang's fmt.Errorf()
func Errorf(format string, a ...interface{}) Error {
	return WrapSkipping(fmt.Errorf(format, a...), 1)
}

// Cast e to *Error, or wrap e in a new *Error with stack
func Wrap(e error) Error {
	return WrapSkipping(e, 1)
}

// Cast e to *Error, or wrap e in a new *Error with stack
// Skip `skip` frames (0 is the call site of `WrapSkipping()`)
func WrapSkipping(e error, skip int) Error {
	switch e1 := e.(type) {
	case nil:
		return nil
	case *merryErr:
		return e1
	default:
		return &merryErr{
			err:   e,
			key:   stack,
			value: captureStack(skip + 1),
		}
	}
}

// Add a context an error.  If the key was already set on e,
// the new value will take precedence.
func WithValue(e error, key, value interface{}) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).WithValue(key, value)
}

// Return the value for key, or nil if not set
func Value(e error, key interface{}) interface{} {
	for {
		switch m := e.(type) {
		case nil:
			return nil
		case *merryErr:
			if m.key == key {
				return m.value
			}
			e = m.err
		default:
			return nil
		}
	}
}

// Return a map of all values attached to the error
// If a key has been attached multiple times, the map will
// contain the last value mapped
func Values(e error) map[interface{}]interface{} {
	if e == nil {
		return nil
	}
	var values map[interface{}]interface{}
	for {
		w, ok := e.(*merryErr)
		if !ok {
			return values
		}
		if values == nil {
			values = make(map[interface{}]interface{}, 1)
		}
		if _, ok := values[w.key]; !ok {
			values[w.key] = w.value
		}
		e = w.err
	}
	return values
}

// Attach a new stack to the error, at the call site of Here().
// Useful when returning copies of exported package errors
func Here(e error) Error {
	switch m := e.(type) {
	case nil:
		return nil
	case *merryErr:
		// optimization: only capture the stack once, since its expensive
		return m.WithStackSkipping(1)
	default:
		return WrapSkipping(e, 1)
	}
}

// Return the stack attached to an error, or nil if one is not attached
func Stack(e error) []uintptr {
	stack, _ := Value(e, stack).([]uintptr)
	return stack
}

// Return an error with an http code attached.
func WithHTTPCode(e error, code int) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).WithHTTPCode(code)
}

// Convert an error to an http status code.  All errors
// map to 500, unless the error has an http code attached.
func HTTPCode(e error) int {
	if e == nil {
		return 200
	}
	code, _ := Value(e, httpCode).(int)
	if code == 0 {
		return 500
	}
	return code
}

// Return the end-user safe message.  Returns empty if not set
func UserMessage(e error) string {
	if e == nil {
		return ""
	}
	msg, _ := Value(e, userMessage).(string)
	return msg
}

// Override the message of error.
// The resulting error's Error() method will return
// the new message
func WithMessage(e error, msg string) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).WithValue(message, msg)
}

// Same as WithMessage(), using fmt.Sprint()
func WithMessagef(e error, format string, a ...interface{}) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).WithMessagef(format, a...)
}

// Add a message which is suitable for end users to see
func WithUserMessage(e error, msg string) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).WithUserMessage(msg)
}

// Add a message which is suitable for end users to see
func WithUserMessagef(e error, format string, args ...interface{}) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).WithUserMessagef(format, args...)
}

// Append a message after the current error message, in the format "original: new"
func Append(e error, msg string) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).Append(msg)
}

// Append a message after the current error message, in the format "original: new"
func Appendf(e error, format string, args ...interface{}) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).Appendf(format, args...)
}

// Prepend a message after the current error message, in the format "new: original"
func Prepend(e error, msg string) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).Prepend(msg)
}

// Prepend a message after the current error message, in the format "new: original"
func Prependf(e error, format string, args ...interface{}) Error {
	if e == nil {
		return nil
	}
	return WrapSkipping(e, 1).Prependf(format, args...)
}

// Check whether e is equal to or wraps the original, at any depth
func Is(e error, originals ...error) bool {
	is := func(e, original error) bool {
		for {
			if e == original {
				return true
			}
			if e == nil || original == nil {
				return false
			}
			w, ok := e.(*merryErr)
			if !ok {
				return false
			}
			e = w.err
		}
	}
	for _, o := range originals {
		if is(e, o) {
			return true
		}
	}
	return false
}

// Return the innermost underlying error.
// Only useful in advanced cases, like if you need to
// cast the underlying error to some type to get
// additional information from it.
func Unwrap(e error) error {
	if e == nil {
		return nil
	}
	for {
		w, ok := e.(*merryErr)
		if !ok {
			return e
		}
		e = w.err
	}
	return e
}

func captureStack(skip int) []uintptr {
	stack := make([]uintptr, MaxStackDepth)
	length := runtime.Callers(2+skip, stack[:])
	return stack[:length]
}

type errorProperty string

const (
	stack       errorProperty = "stack"
	message                   = "message"
	httpCode                  = "http status code"
	userMessage               = "user message"
)

type merryErr struct {
	err        error
	key, value interface{}
}

// implements golang's error interface
// returns the message value if set, otherwise
// delegates to inner error
func (e *merryErr) Error() string {
	m, _ := Value(e, message).(string)
	if m == "" {
		return Unwrap(e).Error()
	}
	return m
}

// return a new error with additional context
func (e *merryErr) WithValue(key, value interface{}) Error {
	if e == nil {
		return nil
	}
	return &merryErr{
		err:   e,
		key:   key,
		value: value,
	}
}

// Shorthand for capturing a new stack trace
func (e *merryErr) Here() Error {
	if e == nil {
		return nil
	}
	return e.WithStackSkipping(1)
}

// return a new error with a new stack capture
func (e *merryErr) WithStackSkipping(skip int) Error {
	if e == nil {
		return nil
	}
	return &merryErr{
		err:   e,
		key:   stack,
		value: captureStack(skip + 1),
	}
}

// return a new error with an http status code attached
func (e *merryErr) WithHTTPCode(code int) Error {
	if e == nil {
		return nil
	}
	return e.WithValue(httpCode, code)
}

// return a new error with a new message
func (e *merryErr) WithMessage(msg string) Error {
	if e == nil {
		return nil
	}
	return e.WithValue(message, msg)
}

// return a new error with a new formatted message
func (e *merryErr) WithMessagef(format string, a ...interface{}) Error {
	if e == nil {
		return nil
	}
	return e.WithMessage(fmt.Sprintf(format, a...))
}

// Add a message which is suitable for end users to see
func (e *merryErr) WithUserMessage(msg string) Error {
	if e == nil {
		return nil
	}
	e1 := e.WithValue(userMessage, msg)
	if e1.Error() == "" {
		e1 = e1.WithMessage(msg)
	}
	return e1
}

// Add a message which is suitable for end users to see
func (e *merryErr) WithUserMessagef(format string, args ...interface{}) Error {
	if e == nil {
		return nil
	}
	return e.WithUserMessage(fmt.Sprintf(format, args...))
}

// Append a message after the current error message, in the format "original: new"
func (e *merryErr) Append(msg string) Error {
	if e == nil {
		return nil
	}
	return e.WithMessagef("%s: %s", e.Error(), msg)
}

// Append a message after the current error message, in the format "original: new"
func (e *merryErr) Appendf(format string, args ...interface{}) Error {
	if e == nil {
		return nil
	}
	return e.Append(fmt.Sprintf(format, args...))
}

// Prepend a message after the current error message, in the format "new: original"
func (e *merryErr) Prepend(msg string) Error {
	if e == nil {
		return nil
	}
	return e.WithMessagef("%s: %s", msg, e.Error())
}

// Prepend a message after the current error message, in the format "new: original"
func (e *merryErr) Prependf(format string, args ...interface{}) Error {
	if e == nil {
		return nil
	}
	return e.Prepend(fmt.Sprintf(format, args...))
}
