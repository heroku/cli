package main_test

import (
	"fmt"
	"runtime"

	cli "."

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("version", func() {
	BeforeEach(func() {
		cli.Start(BASE_CMD_NAME, "version")
	})

	It("shows the version", func() {
		version := fmt.Sprintf(BASE_CMD_NAME+"-cli/%s (%s-%s) %s ?\n", cli.Version, runtime.GOOS, runtime.GOARCH, runtime.Version())
		Expect(stdout()).To(Equal(version))
	})
})
