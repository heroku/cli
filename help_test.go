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

	Context(BinaryName+" help", func() {
		BeforeEach(func() {
			cli.Start(BinaryName, "help")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows the help", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BinaryName + " COMMAND [command-specific-options]"))
		})
	})

	Context(BinaryName+" hlp", func() {
		BeforeEach(func() {
			cli.Start(BinaryName, "hlp")
		})

		It("exits with code 2", func() { Expect(exit).To(Equal(2)) })
		It("has no stdout", func() { Expect(stdout()).To(Equal("")) })
		It("shows invalid command message", func() {
			Expect(stderr()).To(Equal(` !    hlp is not a ` + BinaryName + ` command.
 !    Perhaps you meant help?
 !    Run ` + BinaryName + ` _ to run ` + BinaryName + ` help.
 !    Run ` + BinaryName + ` help for a list of available commands.
`))
		})
		It("reruns sfdx help", func() {
			cli.Start(BinaryName, "_")
			Expect(stdout()).To(HavePrefix("Usage: " + BinaryName + " COMMAND [command-specific-options]"))
		})
	})

	Context(BinaryName+" help plugins", func() {
		BeforeEach(func() {
			cli.Start(BinaryName, "help", "plugins")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins command", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BinaryName + " plugins"))
			Expect(stdout()).To(ContainSubstring(BinaryName + " plugins:link"))
		})
	})

	Context(BinaryName+" plugins --help", func() {
		BeforeEach(func() {
			cli.Start(BinaryName, "plugins", "--help")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins command", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BinaryName + " plugins"))
			Expect(stdout()).To(ContainSubstring(BinaryName + " plugins:link"))
		})
	})

	Context(BinaryName+" help plugins:foo", func() {
		BeforeEach(func() {
			cli.Start(BinaryName, "help", "plugins:foo")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins commands", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BinaryName + " plugins:COMMAND"))
			Expect(stdout()).To(ContainSubstring(BinaryName + " plugins:link"))
		})
	})

	Context(BinaryName+" help plugins", func() {
		BeforeEach(func() {
			cli.Start(BinaryName, "help", "plugins")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help for plugins commands", func() {
			Expect(stdout()).To(ContainSubstring(BinaryName + " plugins:link"))
		})
	})

	Context("help command", func() {
		BeforeEach(func() {
			cli.AllCommands().Find("help").Run(&cli.Context{})
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			Expect(stdout()).To(HavePrefix("Usage: " + BinaryName + " COMMAND"))
		})
	})

	Context("help namespace:topic", func() {
		BeforeEach(func() {
			cli.Start(BinaryName, "help", "heroku:auth")
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			// Should not show up because we are on a DefaultNamespace heroku (moved to top level)
			Expect(stdout()).NotTo(ContainSubstring("auth:2fa"))
		})
	})

	Context("help topic on namespace", func() {
		topicBackup := cli.CLITopics
		corePluginsBackup := cli.CorePlugins

		BeforeEach(func() {
			cli.BinaryName = "sfdx"
			cli.CLITopics = cli.Topics{
				{
					Namespace: "test",
					Name:      "ttopic",
					Commands:  cli.Commands{{Command: "tcommand", Namespace: "test", Description: "mydescription", Run: func(*cli.Context) {}}},
				},
			}

			pluginsObj := &cli.Plugins{}
			pluginsObj.SetPlugins([]*cli.Plugin{&cli.Plugin{Namespace: &cli.Namespace{Name: "test"}}})
			cli.CorePlugins = pluginsObj
			cli.Start(BinaryName, "help", "test:ttopic")
		})
		AfterEach(func() {
			cli.CLITopics = topicBackup
			cli.CorePlugins = corePluginsBackup
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			Expect(stdout()).To(ContainSubstring("ttopic:tcommand"))
			Expect(stdout()).To(ContainSubstring("mydescription"))
		})
	})

	Context("help namespace:topic:command", func() {
		topicBackup := cli.CLITopics
		corePluginsBackup := cli.CorePlugins
		BeforeEach(func() {
			cli.BinaryName = "sfdx"
			cli.CLITopics = cli.Topics{
				{
					Namespace: "test",
					Name:      "ttopic",
					Commands:  cli.Commands{{Command: "tcommand", Namespace: "test", Help: "myhelp", Run: func(*cli.Context) {}}},
				},
			}

			pluginsObj := &cli.Plugins{}
			pluginsObj.SetPlugins([]*cli.Plugin{&cli.Plugin{Namespace: &cli.Namespace{Name: "test"}}})
			cli.CorePlugins = pluginsObj
			cli.Start(BinaryName, "help", "test:ttopic:tcommand")
		})
		AfterEach(func() {
			cli.CLITopics = topicBackup
			cli.CorePlugins = corePluginsBackup
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			Expect(cli.CorePlugins.Plugins()[0].Namespace).To(ContainSubstring("test"))
			// SHouldn't show topic help, should show command help
			Expect(stdout()).To(ContainSubstring("myhelp"))
		})
	})

	Context("help with different namespace", func() {
		topicBackup := cli.CLITopics

		BeforeEach(func() {
			cli.BinaryName = "test"
			cli.CLITopics = cli.Topics{
				{
					Namespace: "test",
					Name:      "ttopic",
					Commands:  cli.Commands{{Run: func(*cli.Context) {}}},
				},
			}
			cli.Start(BinaryName, "help")
		})
		AfterEach(func() {
			cli.CLITopics = topicBackup
		})

		It("exits with code 0", func() { Expect(exit).To(Equal(0)) })
		It("shows help", func() {
			// SHouldn't show topic help, should show command help
			Expect(stdout()).To(ContainSubstring("test ttopic"))
		})
	})
})
