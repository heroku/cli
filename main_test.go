package main_test

import (
	"bytes"
	"os"

	cli "github.com/heroku/cli"

	"github.com/lunixbochs/vtclean"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("version", func() {
	var stdout string
	var stderr string
	exit := 9999

	BeforeEach(func() {
		cli.Stdout = new(bytes.Buffer)
		cli.Stderr = new(bytes.Buffer)
		cli.ExitFn = func(code int) {
			if exit == 9999 {
				exit = code
			}
		}
	})

	AfterEach(func() {
		exit = 9999
		cli.Stdout = os.Stdout
		cli.Stderr = os.Stderr
	})

	JustBeforeEach(func() {
		stdout = vtclean.Clean(cli.Stdout.(*bytes.Buffer).String(), false)
		stderr = vtclean.Clean(cli.Stderr.(*bytes.Buffer).String(), false)
	})

	Context("with no args", func() {
		ran := false
		var topicBackup cli.TopicSet
		BeforeEach(func() {
			topicBackup = cli.Topics
			cli.Topics = cli.TopicSet{
				{
					Name:     "dashboard",
					Commands: cli.CommandSet{{Run: func(*cli.Context) { ran = true }}},
				},
			}
			cli.Start("heroku")
		})
		AfterEach(func() {
			cli.Topics = topicBackup
		})

		It("ran dashboard command", func() { Expect(ran).To(BeTrue()) })
	})

	Describe("ShowDebugInfo", func() {
		BeforeEach(func() {
			cli.Debugging = true
			cli.Args = []string{"heroku", "test"}
			cli.ShowDebugInfo()
		})
		AfterEach(func() {
			cli.Debugging = false
		})
		It("shows command", func() {
			Expect(stderr).To(ContainSubstring("cmd: test"))
		})
	})
})
