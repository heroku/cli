.SECONDEXPANSION:

DIST_DIR?=dist
CACHE_DIR?=tmp/cache
VERSION=$(shell ./bin/version)
REVISION=$(shell git log -n 1 --pretty=format:"%H")

ifeq (,$(findstring working directory clean,$(shell git status 2> /dev/null | tail -n1)))
	DIRTY=-dirty
endif
CHANNEL?:=$(shell git rev-parse --abbrev-ref HEAD)$(DIRTY)
AWS_PATH?=$(CHANNEL)

WORKSPACE?=tmp/dev/sfdx
export PATH := $(WORKSPACE)/lib:$(PATH)

TARGETS:=darwin-amd64 linux-amd64 linux-386 linux-arm windows-amd64 windows-386 freebsd-amd64 freebsd-386 openbsd-amd64 openbsd-386

%/sfdx/VERSION: bin/version
	@mkdir -p $(@D)
	echo $(VERSION) > $@

%/sfdx/lib/cacert.pem: resources/cacert.pem
	@mkdir -p $(@D)
	cp $< $@

%/sfdx/README: resources/standalone/README
	@mkdir -p $(@D)
	cp $< $@

%/sfdx/install: resources/standalone/install
	@mkdir -p $(@D)
	cp $< $@

BUILD_TAGS=release
SOURCES := $(shell ls | grep '\.go')
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Channel=$(CHANNEL) -X=main.GitSHA=$(REVISION)"
GOOS=$(OS)
$(WORKSPACE)/bin/sfdx: OS   := $(shell go env GOOS)
$(WORKSPACE)/bin/sfdx: ARCH := $(shell go env GOARCH)
$(WORKSPACE)/bin/sfdx: BUILD_TAGS=dev
$(WORKSPACE)/bin/sfdx tmp/%/sfdx/bin/sfdx: $(SOURCES) bin/version
	GOOS=$(GOOS) GOARCH=$(ARCH) GO386=$(GO386) GOARM=$(GOARM) go build -tags $(BUILD_TAGS) -o $@ $(LDFLAGS)

%/sfdx/bin/sfdx.exe: $(SOURCES) resources/exe/heroku-codesign-cert.pfx
	GOOS=$(GOOS) GOARCH=$(ARCH) go build $(LDFLAGS) -o $@ -tags $(BUILD_TAGS)
	@osslsigncode -pkcs12 resources/exe/heroku-codesign-cert.pfx \
		-pass '$(HEROKU_WINDOWS_SIGNING_PASS)' \
		-n 'Heroku CLI' \
		-i https://toolbelt.heroku.com/ \
		-in $@ -out $@.signed
	mv $@.signed $@

resources/exe/heroku-codesign-cert.pfx:
	@gpg --yes --passphrase '$(HEROKU_WINDOWS_SIGNING_PASS)' -o resources/exe/heroku-codesign-cert.pfx -d resources/exe/heroku-codesign-cert.pfx.gpg

$(DIST_DIR)/$(VERSION)/sfdx-v$(VERSION)-%.tar.xz: tmp/%
	@if [ -z "$(CHANNEL)" ]; then echo "no channel" && exit 1; fi
	@mkdir -p $(@D)
	tar -C tmp/$* -c sfdx | xz -2 > $@

$(DIST_DIR)/$(VERSION)/gz/sfdx-v$(VERSION)-%.tar.gz: tmp/%
	@if [ -z "$(CHANNEL)" ]; then echo "no channel" && exit 1; fi
	@mkdir -p $(@D)
	tar -C tmp/$* -c sfdx | gzip > $@

comma:=,
empty:=
space:=$(empty) $(empty)
DIST_TARGETS := $(foreach t,$(TARGETS),$(DIST_DIR)/$(VERSION)/sfdx-v$(VERSION)-$(t).tar.xz)
DIST_TARGETS_GZ := $(foreach t,$(TARGETS),$(DIST_DIR)/$(VERSION)/gz/sfdx-v$(VERSION)-$(t).tar.gz)
MANIFEST := $(DIST_DIR)/$(VERSION)/manifest.json
MANIFEST_GZ := $(DIST_DIR)/$(VERSION)/gz/manifest.json
$(MANIFEST): $(WORKSPACE)/bin/sfdx $(DIST_TARGETS)
	@if [ -z "$(CHANNEL)" ]; then echo "no channel" && exit 1; fi
	./bin/build-manifest --version $(VERSION) --channel $(AWS_PATH) --targets $(subst $(space),$(comma),$(DIST_TARGETS)) > $@

$(MANIFEST_GZ): $(WORKSPACE)/bin/sfdx $(DIST_TARGETS_GZ)
	@if [ -z "$(CHANNEL)" ]; then echo "no channel" && exit 1; fi
	./bin/build-manifest --version $(VERSION) --channel $(AWS_PATH) --targets $(subst $(space),$(comma),$(DIST_TARGETS_GZ)) > $@

$(MANIFEST).sig: $(MANIFEST)
	@gpg --armor -u 0F1B0520 --yes --output $@ --detach-sig $<

$(MANIFEST_GZ).sig: $(MANIFEST_GZ)
	@gpg --armor -u 0F1B0520 --yes --output $@ --detach-sig $<

ifneq ($(AWS_PATH),)
PREVIOUS_VERSION:=$(shell curl -fsSL https://cli-assets.heroku.com/branches/$(AWS_PATH)/manifest.json | jq -r '.version')
endif
DIST_PATCHES := $(foreach t,$(TARGETS),$(DIST_DIR)/$(PREVIOUS_VERSION)/sfdx-v$(PREVIOUS_VERSION)-$(t).patch)

$(DIST_DIR)/$(PREVIOUS_VERSION)/sfdx-v$(PREVIOUS_VERSION)-%.patch: $(DIST_DIR)/$(VERSION)/sfdx-v$(VERSION)-%.tar.xz
	@mkdir -p $(@D)
	$(WORKSPACE)/bin/sfdx build:bsdiff --new $< --channel $(CHANNEL) --target $* --out $@

DEB_VERSION:=$(firstword $(subst -, ,$(VERSION)))-1
DEB_BASE:=sfdx_$(DEB_VERSION)
$(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_%.deb: tmp/debian-%
	@mkdir -p tmp/$(DEB_BASE)_$*.apt/DEBIAN
	@mkdir -p tmp/$(DEB_BASE)_$*.apt/usr/bin
	@mkdir -p tmp/$(DEB_BASE)_$*.apt/usr/lib
	sed -e "s/Architecture: ARCHITECTURE/Architecture: $(if $(filter amd64,$*),amd64,$(if $(filter 386,$*),i386,armel))/" resources/deb/control | \
	  sed -e "s/Version: VERSION/Version: $(DEB_VERSION)/" \
		> tmp/$(DEB_BASE)_$*.apt/DEBIAN/control
	cp -r tmp/debian-$*/sfdx tmp/$(DEB_BASE)_$*.apt/usr/lib/
	ln -s ../lib/sfdx/bin/sfdx tmp/$(DEB_BASE)_$*.apt/usr/bin/sfdx
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

$(CACHE_DIR)/git/Git-2.8.1-386.exe:
	@mkdir -p $(CACHE_DIR)/git
	curl -fsSLo $@ https://cli-assets.heroku.com/git/Git-2.8.1-32-bit.exe

$(CACHE_DIR)/git/Git-2.8.1-amd64.exe:
	@mkdir -p $(CACHE_DIR)/git
	curl -fsSLo $@ https://cli-assets.heroku.com/git/Git-2.8.1-64-bit.exe

$(DIST_DIR)/$(VERSION)/sfdx-windows-%.exe: tmp/windows-% $(CACHE_DIR)/git/Git-2.8.1-386.exe $(CACHE_DIR)/git/Git-2.8.1-amd64.exe
	@mkdir -p $(@D)
	rm -rf tmp/windows-$*-installer
	cp -r tmp/windows-$* tmp/windows-$*-installer
	cp $(CACHE_DIR)/git/Git-2.8.1-$*.exe tmp/windows-$*-installer/sfdx/git.exe
	sed -e "s/!define Version 'VERSION'/!define Version '$(VERSION)'/" resources/exe/sfdx.nsi |\
		sed -e "s/InstallDir .*/InstallDir \"\$$PROGRAMFILES$(if $(filter amd64,$*),64,)\\\Heroku\"/" \
		> tmp/windows-$*-installer/sfdx/sfdx.nsi
	makensis tmp/windows-$*-installer/sfdx/sfdx.nsi > /dev/null
	@osslsigncode -pkcs12 resources/exe/sfdx-codesign-cert.pfx \
		-pass '$(HEROKU_WINDOWS_SIGNING_PASS)' \
		-n 'Heroku CLI' \
		-i https://toolbelt.heroku.com/ \
		-in tmp/windows-$*-installer/heroku/installer.exe -out $@

$(DIST_DIR)/$(AWS_PATH)/$(VERSION)/heroku-osx.pkg: tmp/darwin-amd64
	@mkdir -p $(@D)
	./resources/osx/build $@

.PHONY: build
build: $(WORKSPACE)/bin/sfdx $(WORKSPACE)/lib/cacert.pem

.PHONY: install
install: build
	cp -r $(WORKSPACE) /usr/local/lib/sfdx
	rm /usr/local/bin/sfdx
	ln -s /usr/local/lib/sfdx/bin/sfdx /usr/local/bin/sfdx

.PHONY: clean
clean:
	rm -rf tmp dist $(CACHE_DIR) $(DIST_DIR)

.PHONY: test
test: build
	$(WORKSPACE)/bin/sfdx version
	$(WORKSPACE)/bin/sfdx plugins
	$(WORKSPACE)/bin/sfdx status

.PHONY: all
all: darwin linux windows freebsd openbsd

TARGET_DEPS =  tmp/$$(OS)-$$(ARCH)/sfdx/bin/sfdx$$(EXT) \
						   tmp/$$(OS)-$$(ARCH)/sfdx/lib/cacert.pem

STANDALONE_FILES = tmp/$$(OS)-$$(ARCH)/sfdx/README  \
									 tmp/$$(OS)-$$(ARCH)/sfdx/install

tmp/%-amd64: ARCH      := amd64
tmp/%-386:   ARCH      := 386
tmp/%-arm:   ARCH      := arm

tmp/darwin-amd64: OS := darwin
tmp/darwin-amd64: ARCH := amd64
.PHONY: darwin
darwin: tmp/darwin-amd64
tmp/darwin-amd64: $(TARGET_DEPS) $(STANDALONE_FILES)

LINUX_TARGETS  := tmp/linux-amd64 tmp/linux-386 tmp/linux-arm
DEBIAN_TARGETS := tmp/debian-amd64 tmp/debian-386 tmp/debian-arm
tmp/linux-% tmp/debian-%j:      OS    := linux
tmp/linux-arm tmp/debian-arm:   GOARM := 6
tmp/linux-386 tmp/debian-386:   GO386 := 387
tmp/debian-%: OS         := debian
tmp/debian-%: GOOS       := linux
.PHONY: linux debian
linux: $(LINUX_TARGETS)
debian: $(DEBIAN_TARGETS)
$(LINUX_TARGETS): $(STANDALONE_FILES)
$(LINUX_TARGETS) $(DEBIAN_TARGETS): $(TARGET_DEPS)

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
$(WINDOWS_TARGETS): $(TARGET_DEPS)

.PHONY: distwin
distwin: $(DIST_DIR)/$(VERSION)/sfdx-windows-amd64.exe $(DIST_DIR)/$(VERSION)/sfdx-windows-386.exe

.PHONY: disttxz disttgz
disttxz: $(MANIFEST) $(MANIFEST).sig $(DIST_TARGETS)
disttgz: $(MANIFEST_GZ) $(MANIFEST_GZ).sig $(DIST_TARGETS_GZ)

.PHONY: distpatch releasepatch releasepatch/%
distpatch: $(DIST_PATCHES)
releasepatch: $(addprefix releasepatch/,$(DIST_PATCHES))
releasepatch/%: %
	aws s3 cp --cache-control max-age=0 $(DIST_DIR)/$(PREVIOUS_VERSION)/$(@F) s3://heroku-cli-assets/branches/$(AWS_PATH)/$(PREVIOUS_VERSION)/$(@F)

.PHONY: releasetxz
releasetxz: $(MANIFEST) $(MANIFEST).sig $(addprefix releasetxz/,$(DIST_TARGETS))
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/manifest.json s3://heroku-cli-assets/branches/$(AWS_PATH)/$(VERSION)/manifest.json
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/manifest.json s3://heroku-cli-assets/branches/$(AWS_PATH)/manifest.json
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/manifest.json.sig s3://heroku-cli-assets/branches/$(AWS_PATH)/manifest.json.sig
	aws cloudfront create-invalidation --distribution-id EHF9FOCUJYVZ --paths "/branches/$(AWS_PATH)/*"

.PHONY: releasetgz
releasetgz: $(MANIFEST_GZ) $(MANIFEST_GZ).sig $(addprefix releasetgz/,$(DIST_TARGETS_GZ))
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/gz/manifest.json s3://heroku-cli-assets/branches/$(AWS_PATH)/gz/manifest.json
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/gz/manifest.json.sig s3://heroku-cli-assets/branches/$(AWS_PATH)/gz/manifest.json.sig

.PHONY: releasetxz/% releasetgz/%
releasetxz/%.tar.xz: %.tar.xz
	aws s3 cp --cache-control max-age=86400 $< s3://heroku-cli-assets/branches/$(AWS_PATH)/$(VERSION)/$(notdir $<)
	aws s3 cp --cache-control max-age=86400 $< s3://heroku-cli-assets/branches/$(AWS_PATH)/$(notdir $<)
releasetgz/%.tar.gz: %.tar.gz
	aws s3 cp --cache-control max-age=86400 $< s3://heroku-cli-assets/branches/$(AWS_PATH)/$(VERSION)/$(notdir $<)
	aws s3 cp --cache-control max-age=86400 $< s3://heroku-cli-assets/branches/$(AWS_PATH)/$(notdir $<)

.PHONY: distosx
distosx: $(DIST_DIR)/$(AWS_PATH)/$(VERSION)/heroku-osx.pkg

.PHONY: releaseosx
releaseosx: $(DIST_DIR)/$(AWS_PATH)/$(VERSION)/heroku-osx.pkg
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(AWS_PATH)/$(VERSION)/heroku-osx.pkg s3://heroku-cli-assets/branches/$(AWS_PATH)/heroku-osx.pkg

.PHONY: distdeb
distdeb: $(DIST_DIR)/$(VERSION)/apt/Packages $(DIST_DIR)/$(VERSION)/apt/Release

.PHONY: release
release: releasewin releasedeb releasetxz releasetgz
	@if type cowsay >/dev/null 2>&1; then cowsay -f stegosaurus Released $(AWS_PATH)/$(VERSION); fi;

.PHONY: releasedeb
releasedeb: $(DIST_DIR)/$(VERSION)/apt/Packages $(DIST_DIR)/$(VERSION)/apt/Release
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_amd64.deb s3://heroku-cli-assets/branches/$(AWS_PATH)/apt/$(DEB_BASE)_amd64.deb
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_386.deb s3://heroku-cli-assets/branches/$(AWS_PATH)/apt/$(DEB_BASE)_386.deb
	aws s3 cp --cache-control max-age=86400 $(DIST_DIR)/$(VERSION)/apt/$(DEB_BASE)_arm.deb s3://heroku-cli-assets/branches/$(AWS_PATH)/apt/$(DEB_BASE)_arm.deb
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Packages s3://heroku-cli-assets/branches/$(AWS_PATH)/apt/Packages
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Packages.gz s3://heroku-cli-assets/branches/$(AWS_PATH)/apt/Packages.gz
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Release s3://heroku-cli-assets/branches/$(AWS_PATH)/apt/Release
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/apt/Release.gpg s3://heroku-cli-assets/branches/$(AWS_PATH)/apt/Release.gpg

.PHONY: releasewin
releasewin: $(DIST_DIR)/$(VERSION)/heroku-windows-amd64.exe $(DIST_DIR)/$(VERSION)/heroku-windows-386.exe
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/heroku-windows-amd64.exe s3://heroku-cli-assets/branches/$(AWS_PATH)/heroku-windows-amd64.exe
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/heroku-windows-386.exe s3://heroku-cli-assets/branches/$(AWS_PATH)/heroku-windows-386.exe

.PHONY: deps
deps: $(CACHE_DIR)/git/Git-2.8.1-amd64.exe $(CACHE_DIR)/git/Git-2.8.1-386.exe

.DEFAULT_GOAL=build
