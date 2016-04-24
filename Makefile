NPM_VERSION=3.8.7
NODE_VERSION=5.11.0

TARGETS=darwin-amd64 linux-amd64 linux-386 windows-amd64 windows-386

DIST_DIR?=dist
CACHE_DIR?=tmp
VERSION=$(shell ./bin/version)
REVISION=$(shell git log -n 1 --pretty=format:"%H")
CHANNEL?=dev

GOOS=$(shell go env GOOS)
GOARCH=$(shell go env GOARCH)
WORKSPACE=tmp/dev/heroku
VERSIONS := $(foreach target, $(TARGETS), tmp/$(target)/heroku/VERSION)
DIST_TARGETS := $(foreach target, $(TARGETS), $(DIST_DIR)/$(VERSION)/heroku-v$(VERSION)-$(target).tar.xz)
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
tmp/%-amd64/heroku/lib/node-$(NODE_VERSION):  NODE_ARCH=x64
tmp/%-386/heroku/lib/node-$(NODE_VERSION):    NODE_ARCH=x86
tmp/%/heroku/lib/node-$(NODE_VERSION): $(CACHE_DIR)/node-v$(NODE_VERSION)/$$(NODE_BASE).tar.gz
	@mkdir -p tmp/$*
	rm -rf $(@D)/node-*
	tar -C tmp/$* -xzf $<
	mv tmp/$*/$(NODE_BASE)/bin/node $@
	rm -rf tmp/$*/$(NODE_BASE)*
	@touch $@

tmp/%/heroku/lib/node-$(NODE_VERSION).exe: $(CACHE_DIR)/node-v$(NODE_VERSION)/win-$$(NODE_ARCH)/node.exe
	@mkdir -p tmp/$*
	rm -rf $(@D)/node-*
	cp $< $@
	@touch $@

NPM_ARCHIVE=$(CACHE_DIR)/npm-v$(NPM_VERSION).tar.gz
$(NPM_ARCHIVE):
	@mkdir -p $(@D)
	curl -Lso $@ https://github.com/npm/npm/archive/v$(NPM_VERSION).tar.gz
tmp/%/heroku/lib/npm-$(NPM_VERSION): $(NPM_ARCHIVE)
	@mkdir -p $(@D)
	rm -rf $(@D)/npm-*
	tar -C $(@D) -xzf $(NPM_ARCHIVE)
	@touch $@

$(WORKSPACE)/lib/plugins.json: $(WORKSPACE)/bin/heroku package.json $(WORKSPACE)/lib/npm-$(NPM_VERSION) $(WORKSPACE)/lib/node-$(NODE_VERSION)$$(EXT)
	@mkdir -p $(@D)
	cp package.json $(@D)/package.json
	$(WORKSPACE)/bin/heroku setup
	cd $(WORKSPACE)/lib && ./npm-$(NPM_VERSION)/cli.js dedupe # this doesn't work inside the CLI for some reason
	cd $(WORKSPACE)/lib && ./npm-$(NPM_VERSION)/cli.js prune

tmp/%/heroku/lib/plugins.json: $(WORKSPACE)/lib/plugins.json
	cp $(WORKSPACE)/lib/plugins.json $@
	cp $(WORKSPACE)/lib/package.json $(@D)/package.json
	rm -rf $(@D)/node_modules
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
tmp/windows-%/heroku/bin/heroku.exe: GOOS=windows
tmp/%-amd64/heroku/bin/heroku:       GOARCH=amd64
tmp/%-386/heroku/bin/heroku:         GOARCH=386
tmp/dev/heroku/bin/heroku:           AUTOUPDATE=no
tmp/linux-%/heroku/bin/heroku:       AUTOUPDATE=maybe
tmp/darwin-%/heroku/bin/heroku:      AUTOUPDATE=yes
tmp/windows-%/heroku/bin/heroku.exe: AUTOUPDATE=yes
tmp/%/heroku/bin/heroku tmp/%/heroku/bin/heroku.exe: $(SOURCES)
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build $(LDFLAGS) -o $@

$(DIST_DIR)/$(VERSION)/heroku-v$(VERSION)-%.tar.xz: $(VERSIONS)
	@mkdir -p $(@D)
	tar -C tmp/$* -c heroku | xz > $@

comma:=,
empty:=
space:=$(empty) $(empty)
$(DIST_DIR)/$(VERSION)/manifest.json: $(WORKSPACE)/bin/heroku $(DIST_TARGETS)
	$(WORKSPACE)/bin/heroku setup:manifest --dir $(@D) --version $(VERSION) --channel $(CHANNEL) --targets $(subst $(space),$(comma),$(TARGETS)) > $@

.PHONY: build
build: $(WORKSPACE)/bin/heroku $(WORKSPACE)/lib/plugins.json

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
dist: $(MANIFEST)

.PHONY: release
release: $(MANIFEST)
	$(foreach txz, $(DIST_TARGETS), aws s3 cp --cache-control max-age=86400 $(txz) s3://heroku-cli-assets/$(CHANNEL)/$(VERSION)/$(notdir $(txz));)
	aws s3 cp --cache-control max-age=300 $(DIST_DIR)/$(VERSION)/manifest.json s3://heroku-cli-assets/$(CHANNEL)/manifest.json
	@echo Released $(VERSION) on $(CHANNEL)

NODES = node-v$(NODE_VERSION)-darwin-x64.tar.gz \
node-v$(NODE_VERSION)-linux-x64.tar.gz \
win-x64/node.exe \
win-x86/node.exe

NODE_TARGETS := $(foreach node, $(NODES), $(CACHE_DIR)/node-v$(NODE_VERSION)/$(node))
.PHONY: deps
deps: $(NPM_ARCHIVE) $(NODE_TARGETS)

.DEFAULT_GOAL=build
.SECONDARY:
