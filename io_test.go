package main_test

import (
	"bytes"
	"os"

	cli "github.com/heroku/cli"

	"github.com/lunixbochs/vtclean"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("io", func() {
	var out string
	BeforeEach(func() {
		cli.InspectOut = new(bytes.Buffer)
	})

	AfterEach(func() {
		cli.InspectOut = os.Stderr
	})

	JustBeforeEach(func() {
		out = vtclean.Clean(cli.InspectOut.(*bytes.Buffer).String(), false)
	})

	Describe("inspect", func() {
		BeforeEach(func() {
			cli.Inspect(struct{ Name string }{"Jeff"})
		})

		It("inspects a struct", func() {
			Expect(out).To(Equal("{Name:Jeff}\n"))
		})
	})
})
