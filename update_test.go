package main_test

import (
	cli "github.com/heroku/cli"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("update.go", func() {
	Describe("GetUpdateManifest()", func() {
		It("gets the dev manifest", func() {
			manifest := cli.GetUpdateManifest("dev")
			Expect(manifest.Channel).To(Equal("dev"))
		})
	})
})
