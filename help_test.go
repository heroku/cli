package main_test

import (
	cli "github.com/heroku/cli"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("Help", func() {
	exit := 9999

	BeforeEach(func() {
		cli.ExitFn = func(code int) {
			if exit == 9999 {
				exit = code
			}
		}
	})

	AfterEach(func() {
		exit = 9999
	})

	Context("heroku help", func() {
		BeforeEach(func() {
			cli.Start("heroku", "help")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows the help", func() {
			Expect(stdout()).To(HavePrefix("Usage: heroku COMMAND [--app APP] [command-specific-options]"))
		})
	})

	Context("heroku hlp", func() {
		BeforeEach(func() {
			cli.Start("heroku", "hlp")
		})

		It("exits with code 2", func() { Expect(exit).To(Equal(2)) })
		It("has no stdout", func() { Expect(stdout()).To(Equal("")) })
		It("shows invalid command message", func() {
			Expect(stderr()).To(Equal(` !    hlp is not a heroku command.
 !    Perhaps you meant help?
 !    Run heroku _ to run heroku help.
 !    Run heroku help for a list of available commands.
`))
		})
		It("reruns heroku help", func() {
			cli.Start("heroku", "_")
			Expect(stdout()).To(HavePrefix("Usage: heroku COMMAND [--app APP] [command-specific-options]"))
		})
	})

	Context("heroku help plugins", func() {
		BeforeEach(func() {
			cli.Start("heroku", "help", "plugins")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins command", func() {
			Expect(stdout()).To(HavePrefix("Usage: heroku plugins"))
			Expect(stdout()).To(ContainSubstring("heroku plugins:link"))
		})
	})

	Context("heroku plugins --help", func() {
		BeforeEach(func() {
			cli.Start("heroku", "plugins", "--help")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins command", func() {
			Expect(stdout()).To(HavePrefix("Usage: heroku plugins"))
			Expect(stdout()).To(ContainSubstring("heroku plugins:link"))
		})
	})

	Context("heroku help plugins:foo", func() {
		BeforeEach(func() {
			cli.Start("heroku", "help", "plugins:foo")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins commands", func() {
			Expect(stdout()).To(HavePrefix("Usage: heroku plugins:COMMAND"))
			Expect(stdout()).To(ContainSubstring("heroku plugins:link"))
		})
	})

	Context("heroku help plugins", func() {
		BeforeEach(func() {
			cli.Start("heroku", "help", "plugins")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins commands", func() {
			Expect(stdout()).To(ContainSubstring("heroku plugins:link"))
		})
	})

	Context("help command", func() {
		BeforeEach(func() {
			cli.AllCommands().Find("help").Run(&cli.Context{})
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			Expect(stdout()).To(HavePrefix("Usage: heroku COMMAND"))
		})
	})
})
