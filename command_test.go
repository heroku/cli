package main_test

import (
	"bytes"
	"os"

	cli "github.com/heroku/cli"

	"github.com/lunixbochs/vtclean"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("Command", func() {
	var stdout string
	BeforeEach(func() {
		cli.Stdout = new(bytes.Buffer)
		cli.Start("heroku", "version")
		cli.ExitFn = func(code int) {}
	})

	JustBeforeEach(func() {
		stdout = vtclean.Clean(cli.Stdout.(*bytes.Buffer).String(), false)
	})
	AfterEach(func() { cli.Stdout = os.Stdout })

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
		//version := fmt.Sprintf("heroku-cli/%s (%s-%s) %s ?\n", cli.Version, runtime.GOOS, runtime.GOARCH, runtime.Version())
		//Expect(stdout).To(Equal(version))
	})
})
