package main_test

import (
	cli "."

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

	Context(BASE_CMD_NAME+" help", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "help")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows the help", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BASE_CMD_NAME + " COMMAND [command-specific-options]"))
		})
	})

	Context(BASE_CMD_NAME+" hlp", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "hlp")
		})

		It("exits with code 2", func() { Expect(exit).To(Equal(2)) })
		It("has no stdout", func() { Expect(stdout()).To(Equal("")) })
		It("shows invalid command message", func() {
			Expect(stderr()).To(Equal(` !    hlp is not a ` + BASE_CMD_NAME + ` command.
 !    Perhaps you meant help?
 !    Run ` + BASE_CMD_NAME + ` _ to run ` + BASE_CMD_NAME + ` help.
 !    Run ` + BASE_CMD_NAME + ` help for a list of available commands.
`))
		})
		It("reruns sfdx help", func() {
			cli.Start(BASE_CMD_NAME, "_")
			Expect(stdout()).To(HavePrefix("Usage: " + BASE_CMD_NAME + " COMMAND [command-specific-options]"))
		})
	})

	Context(BASE_CMD_NAME+" help plugins", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "help", "plugins")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins command", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BASE_CMD_NAME + " plugins"))
			Expect(stdout()).To(ContainSubstring(BASE_CMD_NAME + " plugins:link"))
		})
	})

	Context(BASE_CMD_NAME+" plugins --help", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "plugins", "--help")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins command", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BASE_CMD_NAME + " plugins"))
			Expect(stdout()).To(ContainSubstring(BASE_CMD_NAME + " plugins:link"))
		})
	})

	Context(BASE_CMD_NAME+" help plugins:foo", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "help", "plugins:foo")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins commands", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BASE_CMD_NAME + " plugins:COMMAND"))
			Expect(stdout()).To(ContainSubstring(BASE_CMD_NAME + " plugins:link"))
		})
	})

	Context(BASE_CMD_NAME+" help plugins", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "help", "plugins")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins commands", func() {
			Expect(stdout()).To(ContainSubstring(BASE_CMD_NAME + " plugins:link"))
		})
	})

	Context("help command", func() {
		BeforeEach(func() {
			cli.AllCommands().Find("help").Run(&cli.Context{})
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BASE_CMD_NAME + " COMMAND"))
		})
	})

	Context("help namespace:topic", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "help", "heroku:auth")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			Expect(stdout()).To(ContainSubstring("heroku:auth:2fa"))
		})
	})

	Context("help topic on namespace", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "help", "auth")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			Expect(stdout()).NotTo(ContainSubstring("heroku:auth:2fa"))
		})
	})

	Context("help namespace:topic:command", func() {
		BeforeEach(func() {
			cli.Start(BASE_CMD_NAME, "help", "heroku:auth:2fa")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			// SHouldn't show topic help, should show command help
			Expect(stdout()).To(ContainSubstring("check 2fa status"))
		})
	})
})
