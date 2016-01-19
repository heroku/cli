package gode

import (
	"os"
	"path/filepath"
	"testing"
)

func TestPackages(t *testing.T) {
	setup()
	must(os.RemoveAll(filepath.Join(rootPath, "node_modules")))
	must(InstallPackages("request"))
	packages, err := Packages()
	must(err)
	for _, pkg := range packages {
		if pkg.Name == "request" {
			return
		}
	}
	t.Fatalf("package did not install")
}

func TestRemovePackage(t *testing.T) {
	setup()
	must(os.RemoveAll(filepath.Join(rootPath, "node_modules")))
	must(InstallPackages("request"))
	packages, err := Packages()
	must(err)
	if len(packages) != 1 {
		t.Fatalf("package did not install correctly")
	}
	must(RemovePackages("request"))
	packages, err = Packages()
	must(err)
	if len(packages) != 0 {
		t.Fatalf("package did not remove correctly")
	}
}

func TestOutdatedPackages(t *testing.T) {
	setup()
	must(InstallPackages("heroku-cli-util@1.0.0"))
	packages, err := OutdatedPackages("heroku-cli-util")
	must(err)
	if packages["heroku-cli-util"] == "" {
		t.Fatal("heroku-cli-util not found")
	}
}

func TestPackagesGithubPackage(t *testing.T) {
	setup()
	must(os.RemoveAll(filepath.Join(rootPath, "node_modules")))
	must(InstallPackages("dickeyxxx/heroku-production-check"))
	packages, err := Packages()
	must(err)
	for _, pkg := range packages {
		if pkg.Name == "heroku-production-check" {
			return
		}
	}
	t.Fatalf("package did not install")
}
