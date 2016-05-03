merry [![Build Status](https://travis-ci.org/ansel1/merry.svg?branch=master)](https://travis-ci.org/ansel1/merry)
=====

Make your golang errors merry, with stacktraces, inheritance, and arbitrary additional context.
            
The package is largely based on http://github.com/go-errors/errors, with additional
inspiration from https://github.com/go-errgo/errgo and https://github.com/amattn/deeperror.

Installation
------------

    go get github.com/ansel1/merry
    
Features
--------

Merry errors work a lot like google's golang.org/x/net/context package.
Merry errors wrap normal errors with a context of key/value pairs.
Like contexts, merry errors are immutable: adding a key/value to an error
always creates a new error which wraps the original.  

`merry` comes with built-in support for adding information to errors:

* stacktraces
* overriding the error message
* HTTP status codes
* End user error messages
 
You can also add your own additional information.

Details
-------

* New errors have a stacktrace captured where they are created
* Add a stacktrace to existing errors (captured where they are wrapped)

    ```go
    err := lib.Read()
    return merry.Wrap(err)  // no-op if err is already merry
    ```
        
* Allow golang idiom of comparing an err value to an exported value, using `Is()`

    ```go
    var ParseError = merry.New("Parse error")
    
    func Parse() error {
        err := ParseError.Here() // captures a stacktrace here
        merry.Is(err, ParseError)  // instead of err == ParseError
    }
    ```
        
* Change the message on an error, while still using `Is()` to compare to the original error

    ```go
    err := merry.WithMessage(ParseError, "Bad input")
    merry.Is(err, ParseError) // yes it is
    ```
        
* `Is()` supports hierarchies of errors

    ```go
    var ParseError = merry.New("Parse error")
    var InvalidCharSet = merry.WithMessage(ParseError, "Invalid char set")
    var InvalidSyntax = merry.WithMessage(ParseError, "Invalid syntax")
    
    func Parse(s string) error {
        // use chainable methods to add context
        return InvalidCharSet.Here().WithMessagef("Invalid char set: %s", "UTF-8")
        // or functions
        // return merry.WithMessagef(merry.Here(InvalidCharSet), "Invalid char set: %s", "UTF-8")
    }
    
    func Check() {
        err := Parse("fields")
        merry.Is(err, ParseError) // yup
        merry.Is(err, InvalidCharSet) // yup
        merry.Is(err, InvalidSyntax) // nope
    }
    ```
        
* Add an HTTP status code

    ```go
    merry.HTTPCode(errors.New("regular error")) // 500
    merry.HTTPCode(merry.New("merry error").WithHTTPCode(404)) // 404
    ```

* Set an alternate error message for end users
 
    ```go
    e := merry.New("crash").WithUserMessage("nothing to see here")
    merry.UserMessage(e)  // returns "nothing to see here"
    ```
        
* Functions for printing error details
 
    ```go
    err := merry.New("boom")
    m := merry.Stacktrace(err) // just the stacktrace
    m = merry.Details(err) // error message and stacktrace
    ```
   
* Add you're own context info

    ```go
    err := merry.New("boom").WithValue("explosive", "black powder")
    ```
    
Basic Usage
-----------

The package contains functions for creating new errors with stacks, or adding a stack to `error` 
instances.  Functions with add context (e.g. `WithValue()`) work on any `error`, and will 
automatically convert them to merry errors (with a stack) if necessary.

Functions which get context values from errors also accept `error`, and will return default
values if the error is not merry, or doesn't have that key attached.

All the functions which create or attach context return concrete instances of `*Error`.  `*Error`
implements methods to add context to the error (they mirror the functions and do
the same thing).  They allow for a chainable syntax for adding context.

Example:

```go
package main

import (
    "github.com/ansel1/merry"
    "errors"
)

var InvalidInputs = errors.New("Input is invalid")

func main() {
    // create a new error, with a stacktrace attached
    err := merry.New("bad stuff happened")
    
    // create a new error with format string, like fmt.Errorf
    err = merry.Errorf("bad input: %v", os.Args)
    
    // capture a fresh stacktrace from this callsite
    err = merry.Here(InvalidInputs)
    
    // Make err merry if it wasn't already.  The stacktrace will be captured here if the
    // error didn't already have one.  Also useful to cast to *Error 
    err = merry.Wrap(err, 0)

    // override the original error's message
    err.WithMessagef("Input is invalid: %v", os.Args)
    
    // Use Is to compare errors against values, which is a common golang idiom
    merry.Is(err, InvalidInputs) // will be true
    
    // associated an http code
    err.WithHTTPCode(400)
    
    perr := parser.Parse("blah")
    err = Wrap(perr, 0)
    // Get the original error back
    merry.Unwrap(err) == perr  // will be true
    
    // Print the error to a string, with the stacktrace, if it has one
    s := merry.Details(err)
    
    // Just print the stacktrace (empty string if err is not a RichError)
    s := merry.Stacktrace(err)

    // Get the location of the error (the first line in the stacktrace)
    file, line := merry.Location(err)
    
    // Get an HTTP status code for an error.  Defaults to 500.
    code := merry.HTTPCode(err)
    
}
```
    
See inline docs for more details.

License
-------

This package is licensed under the MIT license, see LICENSE.MIT for details.
