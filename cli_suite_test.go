package main_test

import (
	"bytes"
	"os"
	"path/filepath"

	cli "github.com/heroku/cli"

	"github.com/lunixbochs/vtclean"

	. "github.com/onsi/ginkgo"
	"github.com/onsi/ginkgo/reporters"
	. "github.com/onsi/gomega"

	"testing"
)

// Copy from start.go to be used in the test namespace
const CLI_NAME = "sfdx"
const BinaryName = "sfdx"
const FolderName = "sfdx"

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
	cli.AppDir, _ = filepath.Abs(filepath.Join("tmp", "dev", FolderName))
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

var _ = BeforeEach(func() {
	cli.BinaryName = BinaryName
	cli.FolderName = FolderName
	cli.Stdout = new(bytes.Buffer)
	cli.Stderr = new(bytes.Buffer)
})

var _ = AfterEach(func() {
	cli.Stdout = os.Stdout
	cli.Stderr = os.Stderr
})

func must(err error) {
	if err != nil {
		panic(err)
	}
}

func stdout() string {
	return stripcolor(cli.Stdout.(*bytes.Buffer).String())
}

func stderr() string {
	return stripcolor(cli.Stderr.(*bytes.Buffer).String())
}

func stripcolor(in string) string {
	return vtclean.Clean(in, false)
}
