NPM_VERSION=3.8.7
NODE_VERSION=5.11.0

TARGETS=darwin-amd64   \
				linux-amd64    \
				linux-386      \
				linux-arm      \
				debian-amd64   \
				debian-386     \
				debian-arm     \
				windows-amd64  \
				windows-386    \
				freebsd-amd64  \
				freebsd-386    \
				openbsd-amd64  \
				openbsd-386

DIST_DIR?=dist
CACHE_DIR?=tmp
VERSION=$(shell ./bin/version)
REVISION=$(shell git log -n 1 --pretty=format:"%H")

ifeq (,$(findstring working directory clean,$(shell git status 2> /dev/null | tail -n1)))
	DIRTY=-dirty
endif
CHANNEL?=$(shell git rev-parse --abbrev-ref HEAD)$(DIRTY)

GOOS=$(shell go env GOOS)
GOARCH=$(shell go env GOARCH)
WORKSPACE=tmp/dev/heroku
VERSIONS := $(foreach target, $(TARGETS), tmp/$(target)/heroku/VERSION)
DIST_TARGETS := $(foreach target, $(TARGETS), $(subst debian,linux,$(DIST_DIR)/$(VERSION)/heroku-v$(VERSION)-$(target).tar.xz))
MANIFEST := $(DIST_DIR)/$(VERSION)/manifest.json

NODE_BASE=node-v$(NODE_VERSION)-$(NODE_OS)-$(NODE_ARCH)
NODE_OS=$(GOOS)
NODE_ARCH=x64

tmp/windows%: EXT=.exe

$(CACHE_DIR)/node-v$(NODE_VERSION)/%:
	@mkdir -p $(@D)
	curl -Lso $@ https://nodejs.org/dist/v$(NODE_VERSION)/$*

.SECONDEXPANSION:
tmp/darwin-%/heroku/lib/node-$(NODE_VERSION): NODE_OS=darwin
tmp/linux-%/heroku/lib/node-$(NODE_VERSION):  NODE_OS=linux
tmp/debian-%/heroku/lib/node-$(NODE_VERSION): NODE_OS=linux
tmp/%-amd64/heroku/lib/node-$(NODE_VERSION):  NODE_ARCH=x64
tmp/%-386/heroku/lib/node-$(NODE_VERSION):    NODE_ARCH=x86
tmp/%-arm/heroku/lib/node-$(NODE_VERSION):    NODE_ARCH=armv6l

.IGNORE: tmp/freebsd-amd64/heroku/lib/node-$(NODE_VERSION) \
	tmp/freebsd-386/heroku/lib/node-$(NODE_VERSION) \
	tmp/openbsd-amd64/heroku/lib/node-$(NODE_VERSION) \
	tmp/openbsd-386/heroku/lib/node-$(NODE_VERSION)

tmp/%/heroku/lib/node-$(NODE_VERSION): $(CACHE_DIR)/node-v$(NODE_VERSION)/$$(NODE_BASE).tar.gz
	@mkdir -p tmp/$*
	@rm -rf $(@D)/node-*
	tar -C tmp/$* -xzf $<
	mv tmp/$*/$(NODE_BASE)/bin/node $@
	@rm -rf tmp/$*/$(NODE_BASE)*
	@touch $@

tmp/%/heroku/lib/node-$(NODE_VERSION).exe: $(CACHE_DIR)/node-v$(NODE_VERSION)/win-$$(NODE_ARCH)/node.exe
	@mkdir -p tmp/$*
	@rm -rf $(@D)/node-*
	cp $< $@
	@touch $@

NPM_ARCHIVE=$(CACHE_DIR)/npm-v$(NPM_VERSION).tar.gz
$(NPM_ARCHIVE):
	@mkdir -p $(@D)
	curl -Lso $@ https://github.com/npm/npm/archive/v$(NPM_VERSION).tar.gz
tmp/%/heroku/lib/npm-$(NPM_VERSION): $(NPM_ARCHIVE)
	@mkdir -p $(@D)
	@rm -rf $(@D)/npm-*
	tar -C $(@D) -xzf $(NPM_ARCHIVE)
	@touch $@

$(WORKSPACE)/lib/plugins.json: $(WORKSPACE)/bin/heroku package.json $(WORKSPACE)/lib/npm-$(NPM_VERSION) $(WORKSPACE)/lib/node-$(NODE_VERSION)$$(EXT)
	@mkdir -p $(@D)
	cp package.json $(@D)/package.json
	$(WORKSPACE)/bin/heroku build:plugins
	@ # this doesn't work in the CLI for some reason
	cd $(WORKSPACE)/lib && ./npm-$(NPM_VERSION)/cli.js dedupe
	cd $(WORKSPACE)/lib && ./npm-$(NPM_VERSION)/cli.js prune

tmp/%/heroku/lib/plugins.json: $(WORKSPACE)/lib/plugins.json
	cp $(WORKSPACE)/lib/plugins.json $@
	cp $(WORKSPACE)/lib/package.json $(@D)/package.json
	@rm -rf $(@D)/node_modules
	cp -r $(WORKSPACE)/lib/node_modules $(@D)

tmp/%/heroku/VERSION: tmp/%/heroku/bin/heroku$$(EXT) tmp/%/heroku/lib/npm-$(NPM_VERSION) tmp/%/heroku/lib/node-$(NODE_VERSION)$$(EXT) tmp/%/heroku/lib/plugins.json bin/version tmp/%/heroku/README.md tmp/%/heroku/CHANGELOG tmp/%/heroku/lib/cacert.pem
	echo $(VERSION) > $@

tmp/%/heroku/README.md: README.md
	@mkdir -p $(@D)
	cp $< $@

tmp/%/heroku/CHANGELOG: CHANGELOG
	@mkdir -p $(@D)
	cp $< $@

tmp/%/heroku/lib/cacert.pem: resources/cacert.pem
	@mkdir -p $(@D)
	cp $< $@

SOURCEDIR=.
SOURCES := $(shell find $(SOURCEDIR) -name '*.go')
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Channel=$(CHANNEL) -X=main.GitSHA=$(REVISION) -X=main.NodeVersion=$(NODE_VERSION) -X=main.NpmVersion=$(NPM_VERSION) -X=main.Autoupdate=$(AUTOUPDATE)"
tmp/darwin-%/heroku/bin/heroku:      GOOS=darwin
tmp/linux-%/heroku/bin/heroku:       GOOS=linux
tmp/debian-%/heroku/bin/heroku:      GOOS=linux
tmp/linux-386/heroku/bin/heroku:     GO386=387
tmp/debian-386/heroku/bin/heroku:    GO386=387
tmp/windows-%/heroku/bin/heroku.exe: GOOS=windows
tmp/freebsd-%/heroku/bin/heroku:     GOOS=freebsd
tmp/openbsd-%/heroku/bin/heroku:     GOOS=openbsd
tmp/%-amd64/heroku/bin/heroku:       GOARCH=amd64
tmp/%-386/heroku/bin/heroku:         GOARCH=386
tmp/%-arm/heroku/bin/heroku:         GOARCH=arm
tmp/%-arm/heroku/bin/heroku:         GOARM=6
tmp/dev/heroku/bin/heroku:           AUTOUPDATE=no
tmp/linux-%/heroku/bin/heroku:       AUTOUPDATE=yes
tmp/debian-%/heroku/bin/heroku:      AUTOUPDATE=no
tmp/darwin-%/heroku/bin/heroku:      AUTOUPDATE=yes
tmp/windows-%/heroku/bin/heroku.exe: AUTOUPDATE=yes
tmp/freebsd-%/heroku/bin/heroku.exe: AUTOUPDATE=yes
tmp/openbsd-%/heroku/bin/heroku.exe: AUTOUPDATE=yes
tmp/%/heroku/bin/heroku: $(SOURCES)
	GOOS=$(GOOS) GOARCH=$(GOARCH) GO386=$(GO386) GOARM=$(GOARM) go build $(LDFLAGS) -o $@

tmp/%/heroku/bin/heroku.exe: $(SOURCES) resources/exe/heroku-codesign-cert.pfx
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build $(LDFLAGS) -o $@
	@osslsigncode -pkcs12 resources/exe/heroku-codesign-cert.pfx \
		-pass '$(HEROKU_WINDOWS_SIGNING_PASS)' \
		-n 'Heroku CLI' \
		-i https://toolbelt.heroku.com/ \
		-in $@ -out $@.signed
	mv $@.signed $@

resources/exe/heroku-codesign-cert.pfx:
	@gpg --yes --passphrase '$(HEROKU_WINDOWS_SIGNING_PASS)' -o resources/exe/heroku-codesign-cert.pfx -d resources/exe/heroku-codesign-cert.pfx.gpg

$(DIST_DIR)/$(VERSION)/heroku-v$(VERSION)-%.tar.xz: $(VERSIONS)
	@mkdir -p $(@D)
	tar -C tmp/$* -c heroku | xz -2 > $@

comma:=,
empty:=
space:=$(empty) $(empty)
$(DIST_DIR)/$(VERSION)/manifest.json: $(WORKSPACE)/bin/heroku $(DIST_TARGETS)
	$(WORKSPACE)/bin/heroku build:manifest --dir $(@D) --version $(VERSION) --channel $(CHANNEL) --targets $(subst $(space),$(comma),$(subst debian,linux,$(TARGETS))) > $@

DEB_VERSION:=$(firstword $(subst -, ,$(VERSION)))-1
DEB_BASE:=heroku_$(DEB_VERSION)
$(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_%.deb: tmp/debian-%/heroku/VERSION
	@mkdir -p tmp/$(DEB_BASE)_$*.apt/DEBIAN
	@mkdir -p tmp/$(DEB_BASE)_$*.apt/usr/bin
	@mkdir -p tmp/$(DEB_BASE)_$*.apt/usr/lib
	sed -e "s/Architecture: ARCHITECTURE/Architecture: $(if $(filter amd64,$*),amd64,$(if $(filter 386,$*),i386,armel))/" resources/deb/control | \
	  sed -e "s/Version: VERSION/Version: $(DEB_VERSION)/" \
		> tmp/$(DEB_BASE)_$*.apt/DEBIAN/control
	cp -r tmp/debian-$*/heroku tmp/$(DEB_BASE)_$*.apt/usr/lib/
	ln -s ../lib/heroku/bin/heroku tmp/$(DEB_BASE)_$*.apt/usr/bin/heroku
	sudo chown -R root tmp/$(DEB_BASE)_$*.apt
	sudo chgrp -R root tmp/$(DEB_BASE)_$*.apt
	mkdir -p $(@D)
	dpkg --build tmp/$(DEB_BASE)_$*.apt $@
	sudo rm -rf tmp/$(DEB_BASE)_$*.apt

$(DIST_DIR)/$(VERSION)/apt/Packages: $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_amd64.deb $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_386.deb $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_arm.deb
	apt-ftparchive packages $(@D) > $@
	gzip -c $@ > $@.gz

$(DIST_DIR)/$(VERSION)/apt/Release: $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_amd64.deb $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_386.deb $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_arm.deb
	apt-ftparchive -c resources/deb/apt-ftparchive.conf release $(@D) > $@
	gpg --digest-algo SHA512 -abs -u 0F1B0520 -o $@.gpg $@

tmp/git/Git-%.exe:
	@mkdir -p tmp/git
	curl -Lso $@ https://cli-assets.heroku.com/git/Git-$*.exe

$(DIST_DIR)/$(VERSION)/heroku-installer-win-%.exe: tmp/windows-%/heroku/VERSION tmp/git/Git-2.8.1-32-bit.exe tmp/git/Git-2.8.1-64-bit.exe
	@mkdir -p $(@D)
	cp tmp/git/Git-2.8.1-64-bit.exe tmp/windows-$*/heroku/git.exe
	sed -e "s/!define Version 'VERSION'/!define Version '$(VERSION)'/" resources/exe/heroku.nsi |\
		sed -e "s/InstallDir .*/InstallDir \"\$$PROGRAMFILES$(if $(filter amd64,$*),64,)\\\Heroku\"/" \
		> tmp/windows-$*/heroku/heroku.nsi
	makensis tmp/windows-$*/heroku/heroku.nsi
	@osslsigncode -pkcs12 resources/exe/heroku-codesign-cert.pfx \
		-pass '$(HEROKU_WINDOWS_SIGNING_PASS)' \
		-n 'Heroku CLI' \
		-i https://toolbelt.heroku.com/ \
		-in tmp/windows-$*/heroku/installer.exe -out $@
	@rm tmp/windows-$*/heroku/heroku.nsi
	@rm tmp/windows-$*/heroku/git.exe
	@rm tmp/windows-$*/heroku/installer.exe

.PHONY: build
build: $(WORKSPACE)/bin/heroku $(WORKSPACE)/lib/plugins.json $(WORKSPACE)/lib/cacert.pem

.PHONY: clean
clean:
	rm -rf tmp dist $(CACHE_DIR) $(DIST_DIR)

.PHONY: test
test: build
	$(WORKSPACE)/bin/heroku version
	$(WORKSPACE)/bin/heroku plugins
	$(WORKSPACE)/bin/heroku status

.PHONY: all
all: $(VERSIONS)

.PHONY: dist
dist: $(MANIFEST) deb distwin

.PHONY: distwin
distwin: $(DIST_DIR)/$(VERSION)/heroku-installer-win-amd64.exe $(DIST_DIR)/$(VERSION)/heroku-installer-win-386.exe

.PHONY: deb
deb: $(DIST_DIR)/$(VERSION)/apt/Packages $(DIST_DIR)/$(VERSION)/apt/Release

.PHONY: release
release: $(MANIFEST) deb distwin
	$(foreach txz, $(DIST_TARGETS), aws s3 cp --cache-control max-age=86400 $(txz) s3://heroku-cli-assets/branches/$(CHANNEL)/$(VERSION)/$(notdir $(txz));)
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_amd64.deb s3://heroku-cli-assets/branches/$(CHANNEL)/apt/$(DEB_BASE)_amd64.deb
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_386.deb s3://heroku-cli-assets/branches/$(CHANNEL)/apt/$(DEB_BASE)_386.deb
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_arm.deb s3://heroku-cli-assets/branches/$(CHANNEL)/apt/$(DEB_BASE)_arm.deb
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/heroku-installer-win-amd64.exe s3://heroku-cli-assets/branches/$(CHANNEL)/$(VERSION)/heroku-installer-win-amd64.exe
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/heroku-installer-win-386.exe s3://heroku-cli-assets/branches/$(CHANNEL)/$(VERSION)/heroku-installer-win-386.exe
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Packages s3://heroku-cli-assets/branches/$(CHANNEL)/apt/Packages
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Packages.gz s3://heroku-cli-assets/branches/$(CHANNEL)/apt/Packages.gz
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Release s3://heroku-cli-assets/branches/$(CHANNEL)/apt/Release
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Release.gpg s3://heroku-cli-assets/branches/$(CHANNEL)/apt/Release.gpg
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/manifest.json s3://heroku-cli-assets/branches/$(CHANNEL)/manifest.json
	@echo Released $(VERSION) on $(CHANNEL)

NODES = node-v$(NODE_VERSION)-darwin-x64.tar.gz \
node-v$(NODE_VERSION)-linux-x64.tar.gz \
node-v$(NODE_VERSION)-linux-x86.tar.gz \
win-x64/node.exe \
win-x86/node.exe

NODE_TARGETS := $(foreach node, $(NODES), $(CACHE_DIR)/node-v$(NODE_VERSION)/$(node))
.PHONY: deps
deps: $(NPM_ARCHIVE) $(NODE_TARGETS) tmp/git/Git-2.8.1-64-bit.exe tmp/git/Git-2.8.1-32-bit.exe

.DEFAULT_GOAL=build
.SECONDARY:
