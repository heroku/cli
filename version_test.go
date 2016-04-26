package main_test

import (
	"bytes"
	"fmt"
	"os"
	"runtime"

	cli "github.com/heroku/cli"

	"github.com/lunixbochs/vtclean"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("version", func() {
	var stdout string
	BeforeEach(func() {
		cli.Stdout = new(bytes.Buffer)
		cli.Start("heroku", "version")
		stdout = vtclean.Clean(cli.Stdout.(*bytes.Buffer).String(), false)
		cli.ExitFn = func(code int) {}
	})
	AfterEach(func() { cli.Stdout = os.Stdout })

	It("shows the version", func() {
		version := fmt.Sprintf("heroku-cli/%s (%s-%s) %s ?\n", cli.Version, runtime.GOOS, runtime.GOARCH, runtime.Version())
		Expect(stdout).To(Equal(version))
	})
})
