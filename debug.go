package main

import (
	"fmt"
	"io/ioutil"
	"strconv"
	"strings"
)

var debugTopic = &Topic{
	Name:   "debug",
	Hidden: true,
}

var debugErrlogCmd = &Command{
	Topic:   "debug",
	Command: "errlog",
	Hidden:  true,
	Flags:   []Flag{{Name: "num", Char: "n", HasValue: true}},
	Run: func(ctx *Context) {
		numS, _ := ctx.Flags["num"].(string)
		if numS == "" {
			numS = "30"
		}
		num, err := strconv.Atoi(numS)
		ExitIfError(err, false)
		body, err := ioutil.ReadFile(ErrLogPath)
		ExitIfError(err, false)
		lines := strings.Split(string(body), "\n")
		start := len(lines) - num - 1
		if start < 0 {
			start = 0
		}
		end := len(lines) - 1
		lines = lines[start:end]
		fmt.Println(strings.Join(lines, "\n"))
	},
}
