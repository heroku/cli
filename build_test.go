package main_test

import (
	"bytes"
	"os"

	cli "github.com/heroku/cli"

	"github.com/lunixbochs/vtclean"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("build", func() {
	var stdout, stderr string
	BeforeEach(func() {
		cli.Stdout = new(bytes.Buffer)
		cli.Stderr = new(bytes.Buffer)
	})

	JustBeforeEach(func() {
		stdout = vtclean.Clean(cli.Stdout.(*bytes.Buffer).String(), false)
		stderr = vtclean.Clean(cli.Stdout.(*bytes.Buffer).String(), false)
	})
	AfterEach(func() {
		cli.Stdout = os.Stdout
		cli.Stderr = os.Stderr
	})

	Describe("build:plugins", func() {
		BeforeEach(func() {
			cli.Start("heroku", "build:plugins")
		})

		It("builds the plugins", func() {
			Expect(stdout).To(Equal(""))
			Expect(stderr).To(Equal(""))
		})
	})
})
