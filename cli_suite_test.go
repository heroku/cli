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

func TestCLI(t *testing.T) {
	os.Setenv("TESTING", "1")
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

var errLogPath = filepath.Join("tmp", "error.log")
var _ = BeforeSuite(func() {
	cli.ErrLogPath = errLogPath
	cli.ErrorArrow = "!"
})

var _ = AfterSuite(func() {
	os.Remove(errLogPath)
})
