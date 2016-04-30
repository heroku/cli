package main_test

import (
	"fmt"
	"runtime"

	cli "github.com/heroku/cli"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("Command", func() {
	BeforeEach(func() {
		cli.Start("heroku", "version")
	})

	Describe("parsing", func() {
		testcase := func(title string, command *cli.Command, expected string) {
			It(title, func() {
				Expect(cli.CommandUsage(command)).To(Equal(expected))
			})
		}
		testcase("basic", &cli.Command{Topic: "apps", Command: "info"}, "apps:info")
		testcase("topic root command", &cli.Command{Topic: "apps", Command: ""}, "apps")
		testcase("with required argument", &cli.Command{Topic: "apps", Command: "info", Args: []cli.Arg{{Name: "foo"}}}, "apps:info FOO")
		testcase("with optional argument", &cli.Command{Topic: "apps", Command: "info", Args: []cli.Arg{{Name: "foo", Optional: true}}}, "apps:info [FOO]")
		testcase("with multiple arguments", &cli.Command{Topic: "apps", Command: "info", Args: []cli.Arg{{Name: "foo"}, {Name: "bar"}}}, "apps:info FOO BAR")
	})

	It("shows the version", func() {
		version := fmt.Sprintf("heroku-cli/%s (%s-%s) %s ?\n", cli.Version, runtime.GOOS, runtime.GOARCH, runtime.Version())
		Expect(stdout()).To(Equal(version))
	})
})
