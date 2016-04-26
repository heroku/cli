package main_test

import (
	"os"
	"path/filepath"

	cli "github.com/heroku/cli"

	. "github.com/onsi/ginkgo"
	"github.com/onsi/ginkgo/reporters"
	. "github.com/onsi/gomega"

	"testing"
)

func TestCli(t *testing.T) {
	RegisterFailHandler(Fail)
	testReports := os.Getenv("CIRCLE_TEST_REPORTS")
	if testReports != "" {
		path := filepath.Join(testReports, "go", "results.xml")
		os.MkdirAll(filepath.Dir(path), 0755)
		junitReporter := reporters.NewJUnitReporter(path)
		RunSpecsWithDefaultAndCustomReporters(t, "CLI Suite", []Reporter{junitReporter})
	} else {
		RunSpecs(t, "CLI Suite")
	}
}

var _ = BeforeSuite(func() {
	cli.ErrorArrow = "!"
})
