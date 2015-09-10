package gode

import (
	"os"
	"path/filepath"
	"testing"
)

func TestPackages(t *testing.T) {
	setup()
	must(os.RemoveAll(filepath.Join(rootPath, "node_modules")))
	must(InstallPackage("request"))
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
	must(InstallPackage("request"))
	packages, err := Packages()
	must(err)
	if len(packages) != 1 {
		t.Fatalf("package did not install correctly")
	}
	must(RemovePackage("request"))
	packages, err = Packages()
	must(err)
	if len(packages) != 0 {
		t.Fatalf("package did not remove correctly")
	}
}

func TestUpdatePackages(t *testing.T) {
	setup()
	must(InstallPackage("request"))
	_, err := UpdatePackages()
	must(err)
}

func TestPackagesGithubPackage(t *testing.T) {
	setup()
	must(os.RemoveAll(filepath.Join(rootPath, "node_modules")))
	must(InstallPackage("dickeyxxx/heroku-production-check"))
	packages, err := Packages()
	must(err)
	for _, pkg := range packages {
		if pkg.Name == "heroku-production-check" {
			return
		}
	}
	t.Fatalf("package did not install")
}
