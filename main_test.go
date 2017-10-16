package main_test

import (
	cli "github.com/heroku/cli"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("version", func() {
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

	Context("with no args", func() {
		ran := false
		var topicBackup cli.Topics
		BeforeEach(func() {
			topicBackup = cli.CLITopics
			cli.CLITopics = cli.Topics{
				{
					Name:     "dashboard",
					Commands: cli.Commands{{Run: func(*cli.Context) { ran = true }}},
				},
			}
			cli.Start(BinaryName)
		})
		AfterEach(func() {
			cli.CLITopics = topicBackup
		})

		It("ran dashboard command", func() { Expect(ran).To(BeTrue()) })
	})
})
