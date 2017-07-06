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
		cli.Start(BinaryName, "version")
	})

	Describe("parsing", func() {
		testcase := func(title string, command *cli.Command, expected string) {
			It(title, func() {
				Expect(cli.CommandUsage(command)).To(Equal(expected))
			})
		}
		testcase("is basic", &cli.Command{Topic: "apps", Command: "info"}, "apps:info")
		testcase("has topic root command", &cli.Command{Topic: "apps", Command: ""}, "apps")
		testcase("has required argument", &cli.Command{Topic: "apps", Command: "info", Args: []cli.Arg{{Name: "foo"}}}, "apps:info FOO")
		testcase("has optional argument", &cli.Command{Topic: "apps", Command: "info", Args: []cli.Arg{{Name: "foo", Optional: true}}}, "apps:info [FOO]")
		testcase("has multiple arguments", &cli.Command{Topic: "apps", Command: "info", Args: []cli.Arg{{Name: "foo"}, {Name: "bar"}}}, "apps:info FOO BAR")
		testcase("has variable arguments", &cli.Command{Topic: "apps", Command: "info", VariableArgs: true, Args: []cli.Arg{{Name: "foo=bar"}}}, "apps:info FOO=BAR")
	})

	It("shows the version", func() {
		version := fmt.Sprintf(BinaryName+"-cli/%s (%s-%s) %s ?\n", cli.Version, runtime.GOOS, runtime.GOARCH, runtime.Version())
		Expect(stdout()).To(Equal(version))
	})
})
