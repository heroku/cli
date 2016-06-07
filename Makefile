.SECONDEXPANSION:

NPM_VERSION=3.9.3
NODE_VERSION=6.2.1

DIST_DIR?=dist
CACHE_DIR?=tmp/cache
VERSION=$(shell ./bin/version)
REVISION=$(shell git log -n 1 --pretty=format:"%H")

ifeq (,$(findstring working directory clean,$(shell git status 2> /dev/null | tail -n1)))
	DIRTY=-dirty
endif
CHANNEL?:=$(shell git rev-parse --abbrev-ref HEAD)$(DIRTY)

WORKSPACE?=tmp/dev/heroku
export PATH := $(WORKSPACE)/lib:$(PATH)
AUTOUPDATE=yes
NODE_OS=$(OS)

TARGETS:=darwin-amd64 linux-amd64 linux-386 linux-arm windows-amd64 windows-386 freebsd-amd64 freebsd-386 openbsd-amd64 openbsd-386

$(CACHE_DIR)/node-v$(NODE_VERSION)/%:
	@mkdir -p $(@D)
	curl -fsSLo $@ https://nodejs.org/dist/v$(NODE_VERSION)/$*

$(WORKSPACE)/lib/node: NODE_OS      := $(shell go env GOOS)
$(WORKSPACE)/lib/node: NODE_ARCH    := $(subst amd64,x64,$(shell go env GOARCH))
%/heroku/lib/node: $(CACHE_DIR)/node-v$(NODE_VERSION)/node-v$(NODE_VERSION)-$$(NODE_OS)-$$(NODE_ARCH).tar.gz
	@mkdir -p $(@D)
	tar -C $(@D) -xzf $<
	cp $(@D)/node-v$(NODE_VERSION)-$(NODE_OS)-$(NODE_ARCH)/bin/node $@
	rm -rf $(@D)/node-*
	@touch $@

tmp/windows-%/heroku/lib/node.exe: $(CACHE_DIR)/node-v$(NODE_VERSION)/win-$$(NODE_ARCH)/node.exe
	@mkdir -p $(@D)
	cp $< $@
	@touch $@

NPM_ARCHIVE=$(CACHE_DIR)/npm-v$(NPM_VERSION).tar.gz
$(NPM_ARCHIVE):
	@mkdir -p $(@D)
	curl -fsSLo $@ https://github.com/npm/npm/archive/v$(NPM_VERSION).tar.gz
%/heroku/lib/npm: $(NPM_ARCHIVE)
	@mkdir -p $(@D)
	tar -C $(@D) -xzf $(NPM_ARCHIVE)
	mv $(@D)/npm-* $@
	@touch $@

$(WORKSPACE)/lib/plugins.json: package.json $(WORKSPACE)/lib/npm $(WORKSPACE)/lib/node$$(EXT) | $(WORKSPACE)/bin/heroku
	@mkdir -p $(@D)
	cp package.json $(@D)/package.json
	$(WORKSPACE)/bin/heroku build:plugins
	@ # this doesn't work in the CLI for some reason
	cd $(WORKSPACE)/lib && ./npm/cli.js dedupe > /dev/null
	cd $(WORKSPACE)/lib && ./npm/cli.js prune > /dev/null

tmp/%/heroku/lib/plugins.json: $(WORKSPACE)/lib/plugins.json
	@mkdir -p $(@D)
	cp $(WORKSPACE)/lib/plugins.json $@
	cp $(WORKSPACE)/lib/package.json $(@D)/package.json
	@rm -rf $(@D)/node_modules
	cp -r $(WORKSPACE)/lib/node_modules $(@D)

%/heroku/VERSION: bin/version
	@mkdir -p $(@D)
	echo $(VERSION) > $@

%/heroku/lib/cacert.pem: resources/cacert.pem
	@mkdir -p $(@D)
	cp $< $@

%/heroku/README: resources/standalone/README
	@mkdir -p $(@D)
	cp $< $@

%/heroku/install: resources/standalone/install
	@mkdir -p $(@D)
	cp $< $@

BUILD_TAGS=release
SOURCES := $(shell ls | grep '\.go')
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Channel=$(CHANNEL) -X=main.GitSHA=$(REVISION) -X=main.NodeVersion=$(NODE_VERSION) -X=main.Autoupdate=$(AUTOUPDATE)"
GOOS=$(OS)
$(WORKSPACE)/bin/heroku: OS   := $(shell go env GOOS)
$(WORKSPACE)/bin/heroku: ARCH := $(shell go env GOARCH)
$(WORKSPACE)/bin/heroku: AUTOUPDATE=no
$(WORKSPACE)/bin/heroku: BUILD_TAGS=dev
$(WORKSPACE)/bin/heroku tmp/%/heroku/bin/heroku: $(SOURCES) bin/version
	GOOS=$(GOOS) GOARCH=$(ARCH) GO386=$(GO386) GOARM=$(GOARM) go build -tags $(BUILD_TAGS) -o $@ $(LDFLAGS)

%/heroku/bin/heroku.exe: $(SOURCES) resources/exe/heroku-codesign-cert.pfx
	GOOS=$(GOOS) GOARCH=$(ARCH) go build $(LDFLAGS) -o $@ -tags $(BUILD_TAGS)
	@osslsigncode -pkcs12 resources/exe/heroku-codesign-cert.pfx \
		-pass '$(HEROKU_WINDOWS_SIGNING_PASS)' \
		-n 'Heroku CLI' \
		-i https://toolbelt.heroku.com/ \
		-in $@ -out $@.signed
	mv $@.signed $@

resources/exe/heroku-codesign-cert.pfx:
	@gpg --yes --passphrase '$(HEROKU_WINDOWS_SIGNING_PASS)' -o resources/exe/heroku-codesign-cert.pfx -d resources/exe/heroku-codesign-cert.pfx.gpg

$(DIST_DIR)/$(VERSION)/heroku-v$(VERSION)-%.tar.xz: tmp/%
	@if [ -z "$(CHANNEL)" ]; then echo "no channel" && exit 1; fi
	@mkdir -p $(@D)
	tar -C tmp/$* -c heroku | xz -2 > $@

$(DIST_DIR)/$(VERSION)/gz/heroku-v$(VERSION)-%.tar.gz: tmp/%
	@if [ -z "$(CHANNEL)" ]; then echo "no channel" && exit 1; fi
	@mkdir -p $(@D)
	tar -C tmp/$* -c heroku | gzip > $@

comma:=,
empty:=
space:=$(empty) $(empty)
DIST_TARGETS := $(foreach t,$(TARGETS),$(DIST_DIR)/$(VERSION)/heroku-v$(VERSION)-$(t).tar.xz)
DIST_TARGETS_GZ := $(foreach t,$(TARGETS),$(DIST_DIR)/$(VERSION)/gz/heroku-v$(VERSION)-$(t).tar.gz)
MANIFEST := $(DIST_DIR)/$(VERSION)/manifest.json
MANIFEST_GZ := $(DIST_DIR)/$(VERSION)/gz/manifest.json
$(MANIFEST): $(WORKSPACE)/bin/heroku $(DIST_TARGETS)
	@if [ -z "$(CHANNEL)" ]; then echo "no channel" && exit 1; fi
	$(WORKSPACE)/bin/heroku build:manifest --dir $(@D) --version $(VERSION) --channel $(CHANNEL) --targets $(subst $(space),$(comma),$(DIST_TARGETS)) > $@

$(MANIFEST_GZ): $(WORKSPACE)/bin/heroku $(DIST_TARGETS_GZ)
	@if [ -z "$(CHANNEL)" ]; then echo "no channel" && exit 1; fi
	$(WORKSPACE)/bin/heroku build:manifest --dir $(@D) --version $(VERSION) --channel $(CHANNEL) --targets $(subst $(space),$(comma),$(DIST_TARGETS_GZ)) > $@

$(MANIFEST).sig: $(MANIFEST)
	@gpg --armor -u 0F1B0520 --yes --output $@ --detach-sig $<

$(MANIFEST_GZ).sig: $(MANIFEST_GZ)
	@gpg --armor -u 0F1B0520 --yes --output $@ --detach-sig $<

ifneq ($(CHANNEL),)
PREVIOUS_VERSION:=$(shell curl -fsSL https://cli-assets.heroku.com/branches/$(CHANNEL)/manifest.json | jq -r '.version')
endif
DIST_PATCHES := $(foreach t,$(TARGETS),$(DIST_DIR)/$(PREVIOUS_VERSION)/heroku-v$(PREVIOUS_VERSION)-$(t).patch)

$(DIST_DIR)/$(PREVIOUS_VERSION)/heroku-v$(PREVIOUS_VERSION)-%.patch: $(DIST_DIR)/$(VERSION)/heroku-v$(VERSION)-%.tar.xz
	@mkdir -p $(@D)
	$(WORKSPACE)/bin/heroku build:bsdiff --new $< --channel $(CHANNEL) --target $* --out $@

DEB_VERSION:=$(firstword $(subst -, ,$(VERSION)))-1
DEB_BASE:=heroku_$(DEB_VERSION)
$(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_%.deb: tmp/debian-%
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
	cd $(@D) && apt-ftparchive packages . > Packages
	gzip -c $@ > $@.gz

$(DIST_DIR)/$(VERSION)/apt/Release: $(DIST_DIR)/$(VERSION)/apt/Packages
	cd $(@D) && apt-ftparchive -c ../../../resources/deb/apt-ftparchive.conf release . > Release
	@gpg --digest-algo SHA512 -abs -u 0F1B0520 -o $@.gpg $@

$(CACHE_DIR)/git/Git-%.exe:
	@mkdir -p $(CACHE_DIR)/git
	curl -fsSLo $@ https://cli-assets.heroku.com/git/Git-$*.exe

$(DIST_DIR)/$(VERSION)/heroku-windows-%.exe: tmp/windows-% $(CACHE_DIR)/git/Git-2.8.1-32-bit.exe $(CACHE_DIR)/git/Git-2.8.1-64-bit.exe
	@mkdir -p $(@D)
	rm -rf tmp/windows-$*-installer
	cp -r tmp/windows-$* tmp/windows-$*-installer
	cp $(CACHE_DIR)/git/Git-2.8.1-64-bit.exe tmp/windows-$*-installer/heroku/git.exe
	sed -e "s/!define Version 'VERSION'/!define Version '$(VERSION)'/" resources/exe/heroku.nsi |\
		sed -e "s/InstallDir .*/InstallDir \"\$$PROGRAMFILES$(if $(filter amd64,$*),64,)\\\Heroku\"/" \
		> tmp/windows-$*-installer/heroku/heroku.nsi
	makensis tmp/windows-$*-installer/heroku/heroku.nsi > /dev/null
	@osslsigncode -pkcs12 resources/exe/heroku-codesign-cert.pfx \
		-pass '$(HEROKU_WINDOWS_SIGNING_PASS)' \
		-n 'Heroku CLI' \
		-i https://toolbelt.heroku.com/ \
		-in tmp/windows-$*-installer/heroku/installer.exe -out $@

$(DIST_DIR)/$(VERSION)/heroku-osx.pkg: tmp/darwin-amd64/heroku/VERSION
	@echo "TODO OSX"

.PHONY: build
build: $(WORKSPACE)/bin/heroku $(WORKSPACE)/lib/npm $(WORKSPACE)/lib/node $(WORKSPACE)/lib/plugins.json $(WORKSPACE)/lib/cacert.pem

.PHONY: install
install: build
	cp -r $(WORKSPACE) /usr/local/lib/heroku
	rm /usr/local/bin/heroku
	ln -s /usr/local/lib/heroku/bin/heroku /usr/local/bin/heroku

.PHONY: clean
clean:
	rm -rf tmp dist $(CACHE_DIR) $(DIST_DIR)

.PHONY: test
test: build
	$(WORKSPACE)/bin/heroku version
	$(WORKSPACE)/bin/heroku plugins
	$(WORKSPACE)/bin/heroku status

.PHONY: all
all: darwin linux windows freebsd openbsd

TARGET_DEPS =  tmp/$$(OS)-$$(ARCH)/heroku/bin/heroku$$(EXT) \
						   tmp/$$(OS)-$$(ARCH)/heroku/lib/npm           \
						   tmp/$$(OS)-$$(ARCH)/heroku/lib/plugins.json  \
						   tmp/$$(OS)-$$(ARCH)/heroku/lib/cacert.pem

STANDALONE_FILES = tmp/$$(OS)-$$(ARCH)/heroku/README  \
									 tmp/$$(OS)-$$(ARCH)/heroku/install

tmp/%-amd64: ARCH      := amd64
tmp/%-amd64: NODE_ARCH := x64
tmp/%-386:   ARCH      := 386
tmp/%-386:   NODE_ARCH := x86
tmp/%-arm:   ARCH      := arm
tmp/%-arm:   NODE_ARCH := armv6l

tmp/darwin-amd64: OS := darwin
tmp/darwin-amd64: ARCH := amd64
tmp/darwin-amd64: NODE_ARCH := x64
.PHONY: darwin
darwin: tmp/darwin-amd64
tmp/darwin-amd64: $(TARGET_DEPS) tmp/$$(OS)-$$(ARCH)/heroku/lib/node $(STANDALONE_FILES)

LINUX_TARGETS  := tmp/linux-amd64 tmp/linux-386 tmp/linux-arm
DEBIAN_TARGETS := tmp/debian-amd64 tmp/debian-386 tmp/debian-arm
tmp/linux-% tmp/debian-%j:      OS    := linux
tmp/linux-arm tmp/debian-arm:   GOARM := 6
tmp/linux-386 tmp/debian-386:   GO386 := 387
tmp/debian-%: AUTOUPDATE := no
tmp/debian-%: OS         := debian
tmp/debian-%: NODE_OS    := linux
tmp/debian-%: GOOS       := linux
.PHONY: linux debian
linux: $(LINUX_TARGETS)
debian: $(DEBIAN_TARGETS)
$(LINUX_TARGETS): $(STANDALONE_FILES)
$(LINUX_TARGETS) $(DEBIAN_TARGETS): $(TARGET_DEPS) tmp/$$(OS)-$$(ARCH)/heroku/lib/node

FREEBSD_TARGETS := tmp/freebsd-amd64 tmp/freebsd-386
tmp/freebsd-%: OS := freebsd
.PHONY: freebsd
freebsd: $(FREEBSD_TARGETS)
$(FREEBSD_TARGETS): $(TARGET_DEPS) $(STANDALONE_FILES)

OPENBSD_TARGETS := tmp/openbsd-amd64 tmp/openbsd-386
tmp/openbsd-%: OS := openbsd
.PHONY: openbsd
openbsd: $(OPENBSD_TARGETS)
$(OPENBSD_TARGETS): $(TARGET_DEPS) $(STANDALONE_FILES)

WINDOWS_TARGETS := tmp/windows-amd64 tmp/windows-386
tmp/windows-%: OS := windows
tmp/windows-%: EXT := .exe
.PHONY: windows
windows: $(WINDOWS_TARGETS)
$(WINDOWS_TARGETS): $(TARGET_DEPS) tmp/windows-$$(ARCH)/heroku/lib/node.exe

.PHONY: distwin
distwin: $(DIST_DIR)/$(VERSION)/heroku-windows-amd64.exe $(DIST_DIR)/$(VERSION)/heroku-windows-386.exe

.PHONY: disttxz disttgz
disttxz: $(MANIFEST) $(MANIFEST).sig $(DIST_TARGETS)
disttgz: $(MANIFEST_GZ) $(MANIFEST_GZ).sig $(DIST_TARGETS_GZ)

.PHONY: distpatch releasepatch releasepatch/%
distpatch: $(DIST_PATCHES)
releasepatch: $(addprefix releasepatch/,$(DIST_PATCHES))
releasepatch/%: %
	aws s3 cp --cache-control max-age=0 $(DIST_DIR)/$(PREVIOUS_VERSION)/$(@F) s3://heroku-cli-assets/branches/$(CHANNEL)/$(PREVIOUS_VERSION)/$(@F)

.PHONY: releasetxz
releasetxz: $(MANIFEST) $(MANIFEST).sig $(addprefix releasetxz/,$(DIST_TARGETS))
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/manifest.json s3://heroku-cli-assets/branches/$(CHANNEL)/manifest.json
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/manifest.json.sig s3://heroku-cli-assets/branches/$(CHANNEL)/manifest.json.sig

.PHONY: releasetgz
releasetgz: $(MANIFEST_GZ) $(MANIFEST_GZ).sig $(addprefix releasetgz/,$(DIST_TARGETS_GZ))
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/gz/manifest.json s3://heroku-cli-assets/branches/$(CHANNEL)/gz/manifest.json
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/gz/manifest.json.sig s3://heroku-cli-assets/branches/$(CHANNEL)/gz/manifest.json.sig

.PHONY: releasetxz/% releasetgz/%
releasetxz/%.tar.xz: %.tar.xz
	aws s3 cp --cache-control max-age=86400 $< s3://heroku-cli-assets/branches/$(CHANNEL)/$(VERSION)/$(notdir $<)
releasetgz/%.tar.gz: %.tar.gz
	aws s3 cp --cache-control max-age=86400 $< s3://heroku-cli-assets/branches/$(CHANNEL)/$(VERSION)/$(notdir $<)

.PHONY: distosx
distosx: $(DIST_DIR)/$(VERSION)/heroku-osx.pkg

.PHONY: releaseosx
releaseosx: $(DIST_DIR)/$(VERSION)/heroku-osx.pkg
	aws s3 cp --cache-control max-age=3600 $(DIST_DIR)/$(VERSION)/heroku-osx.pkg s3://heroku-cli-assets/branches/$(CHANNEL)/heroku-osx.pkg

.PHONY: distdeb
distdeb: $(DIST_DIR)/$(VERSION)/apt/Packages $(DIST_DIR)/$(VERSION)/apt/Release

.PHONY: release
release: releasewin releasedeb releasetxz releasetgz
	@if type cowsay >/dev/null 2>&1; then cowsay -f stegosaurus Released $(CHANNEL)/$(VERSION); fi;

.PHONY: releasedeb
releasedeb: $(DIST_DIR)/$(VERSION)/apt/Packages $(DIST_DIR)/$(VERSION)/apt/Release
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_amd64.deb s3://heroku-cli-assets/branches/$(CHANNEL)/apt/$(DEB_BASE)_amd64.deb
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_386.deb s3://heroku-cli-assets/branches/$(CHANNEL)/apt/$(DEB_BASE)_386.deb
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_arm.deb s3://heroku-cli-assets/branches/$(CHANNEL)/apt/$(DEB_BASE)_arm.deb
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Packages s3://heroku-cli-assets/branches/$(CHANNEL)/apt/Packages
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Packages.gz s3://heroku-cli-assets/branches/$(CHANNEL)/apt/Packages.gz
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Release s3://heroku-cli-assets/branches/$(CHANNEL)/apt/Release
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Release.gpg s3://heroku-cli-assets/branches/$(CHANNEL)/apt/Release.gpg

.PHONY: releasewin
releasewin: $(DIST_DIR)/$(VERSION)/heroku-windows-amd64.exe $(DIST_DIR)/$(VERSION)/heroku-windows-386.exe
	aws s3 cp --cache-control max-age=3600 $(DIST_DIR)/$(VERSION)/heroku-windows-amd64.exe s3://heroku-cli-assets/branches/$(CHANNEL)/heroku-windows-amd64.exe
	aws s3 cp --cache-control max-age=3600 $(DIST_DIR)/$(VERSION)/heroku-windows-386.exe s3://heroku-cli-assets/branches/$(CHANNEL)/heroku-windows-386.exe

NODES = node-v$(NODE_VERSION)-darwin-x64.tar.gz \
node-v$(NODE_VERSION)-linux-x64.tar.gz \
node-v$(NODE_VERSION)-linux-x86.tar.gz \
node-v$(NODE_VERSION)-linux-armv6l.tar.gz \
win-x64/node.exe \
win-x86/node.exe

NODE_TARGETS := $(foreach node, $(NODES), $(CACHE_DIR)/node-v$(NODE_VERSION)/$(node))
.PHONY: deps
deps: $(NPM_ARCHIVE) $(NODE_TARGETS) $(CACHE_DIR)/git/Git-2.8.1-64-bit.exe $(CACHE_DIR)/git/Git-2.8.1-32-bit.exe

.DEFAULT_GOAL=build
