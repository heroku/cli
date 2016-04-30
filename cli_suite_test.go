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
	cli.AppDir, _ = filepath.Abs(filepath.Join("tmp", "dev", "heroku"))
	cli.CorePlugins.Path = filepath.Join(cli.AppDir, "lib")
	cli.ExitFn = func(int) {}
	os.MkdirAll(filepath.Dir(errLogPath), 0755)
	cli.ErrLogPath = errLogPath
	cli.ErrorArrow = "!"
})

var _ = AfterSuite(func() {
	os.Remove(errLogPath)
	cli.ShowCursor()
})

func must(err error) {
	if err != nil {
		panic(err)
	}
}
