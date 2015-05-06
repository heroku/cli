package gode

import (
	"os"
	"path/filepath"
	"testing"
)

func TestPackages(t *testing.T) {
	c := setup()
	must(os.RemoveAll(filepath.Join(c.RootPath, "node_modules")))
	must(c.InstallPackage("request"))
	packages, err := c.Packages()
	must(err)
	for _, pkg := range packages {
		if pkg.Name == "request" {
			return
		}
	}
	t.Fatalf("package did not install")
}

func TestRemovePackage(t *testing.T) {
	c := setup()
	must(os.RemoveAll(filepath.Join(c.RootPath, "node_modules")))
	must(c.InstallPackage("request"))
	packages, err := c.Packages()
	must(err)
	if len(packages) != 1 {
		t.Fatalf("package did not install correctly")
	}
	must(c.RemovePackage("request"))
	packages, err = c.Packages()
	must(err)
	if len(packages) != 0 {
		t.Fatalf("package did not remove correctly")
	}
}

func TestUpdatePackages(t *testing.T) {
	c := setup()
	must(c.InstallPackage("request"))
	_, err := c.UpdatePackages()
	must(err)
}

func TestPackagesGithubPackage(t *testing.T) {
	c := setup()
	must(os.RemoveAll(filepath.Join(c.RootPath, "node_modules")))
	must(c.InstallPackage("dickeyxxx/heroku-production-check"))
	packages, err := c.Packages()
	must(err)
	for _, pkg := range packages {
		if pkg.Name == "heroku-production-check" {
			return
		}
	}
	t.Fatalf("package did not install")
}
