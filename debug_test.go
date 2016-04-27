package main_test

import (
	"bytes"
	"os"

	cli "github.com/heroku/cli"

	"github.com/lunixbochs/vtclean"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("debug", func() {
	const butt = "<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>\n"
	var stdout string
	BeforeEach(func() {
		cli.Stdout = new(bytes.Buffer)
		f, err := os.Create(cli.ErrLogPath)
		if err != nil {
			panic(err)
		}
		f.WriteString(butt)
		f.Close()
		cli.Start("heroku", "debug:errlog")
		stdout = vtclean.Clean(cli.Stdout.(*bytes.Buffer).String(), false)
		cli.ExitFn = func(code int) {}
	})
	AfterEach(func() { cli.Stdout = os.Stdout })

	It("shows the error log", func() {
		Expect(stdout).To(ContainSubstring(butt))
	})
})
