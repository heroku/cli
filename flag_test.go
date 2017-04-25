package main_test

import (
	cli "github.com/heroku/cli"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var verboseFlag = &cli.Flag{
	Name:     "verbose",
	Char:     "v",
	HasValue: false,
}

var _ = Describe("ParseFlag", func() {
	test := func(flag *cli.Flag, input, expected, expectedErr string) {
		It(input, func() {
			out, val, err := cli.ParseFlag(input, []*cli.Flag{flag})
			if expectedErr != "" {
				Expect(err.Error()).To(Equal(expectedErr))
			} else {
				Expect(err).ShouldNot(HaveOccurred())
				Expect(out).To(Equal(flag))
				Expect(val).To(Equal(expected))
			}
		})
	}
	test(verboseFlag, "--verbose", "", "")
	test(verboseFlag, "--verbose=foo", "", " -v, --verbose does not take a value")
	test(verboseFlag, "-v", "", "")
})
