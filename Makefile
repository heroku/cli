NPM_VERSION=3.8.7
NODE_VERSION=5.11.0

TARGETS=darwin-amd64 linux-amd64

DIST_DIR?=dist
CACHE_DIR?=tmp
VERSION=$(shell ./bin/version)
REVISION=$(shell git log -n 1 --pretty=format:"%H")
CHANNEL=$(shell git rev-parse --abbrev-ref HEAD)

GOOS=$(shell go env GOOS)
GOARCH=$(shell go env GOARCH)
WORKSPACE=tmp/$(GOOS)-$(GOARCH)/heroku
VERSIONS:=$(foreach target, $(TARGETS), tmp/$(target)/heroku/VERSION)

NODE_BASE=node-v$(NODE_VERSION)-$(NODE_OS)-$(NODE_ARCH)
$(CACHE_DIR)/node-v$(NODE_VERSION)/%:
	@mkdir -p $(@D)
	curl -Lso $@ https://nodejs.org/dist/v$(NODE_VERSION)/$*

.SECONDEXPANSION:
tmp/darwin-%/heroku/lib/node-$(NODE_VERSION): NODE_OS=darwin
tmp/linux-%/heroku/lib/node-$(NODE_VERSION):  NODE_OS=linux
tmp/%-amd64/heroku/lib/node-$(NODE_VERSION):  NODE_ARCH=x64
tmp/%-386/heroku/lib/node-$(NODE_VERSION):    NODE_ARCH=x86
tmp/%/heroku/lib/node-$(NODE_VERSION): $(CACHE_DIR)/node-v$(NODE_VERSION)/$$(NODE_BASE).tar.gz
	@mkdir -p tmp/node-v$(NODE_VERSION)
	tar -C tmp/node-v$(NODE_VERSION) -xzf $<
	mv tmp/node-v$(NODE_VERSION)/$(NODE_BASE)/bin/node $@
	rm -rf tmp/node-v$(NODE_VERSION)/$(NODE_BASE)*

NPM_ARCHIVE=$(CACHE_DIR)/npm-v$(NPM_VERSION).tar.gz
$(NPM_ARCHIVE):
	@mkdir -p $(@D)
	curl -Lso $@ https://github.com/npm/npm/archive/v$(NPM_VERSION).tar.gz
tmp/%/heroku/lib/npm-$(NPM_VERSION): $(NPM_ARCHIVE)
	@mkdir -p $(@D)
	tar -C $(@D) -xzf $(NPM_ARCHIVE)
	@touch $@

$(WORKSPACE)/lib/plugins.json: $(WORKSPACE)/bin/heroku package.json $(WORKSPACE)/lib/npm-$(NPM_VERSION) $(WORKSPACE)/lib/node-$(NODE_VERSION)
	@mkdir -p $(@D)
	cp package.json $(@D)/package.json
	$(WORKSPACE)/bin/heroku setup

tmp/%/heroku/lib/plugins.json: $(WORKSPACE)/lib/plugins.json
	cp $(WORKSPACE)/lib/plugins.json $@
	cp $(WORKSPACE)/lib/package.json $(@D)/package.json
	cp -r $(WORKSPACE)/lib/node_modules $(@D)

tmp/%/heroku/VERSION: tmp/%/heroku/bin/heroku tmp/%/heroku/lib/npm-$(NPM_VERSION) tmp/%/heroku/lib/node-$(NODE_VERSION) tmp/%/heroku/lib/plugins.json bin/version tmp/%/heroku/README.md tmp/%/heroku/CHANGELOG tmp/%/heroku/lib/cacert.pem
	echo $(VERSION) > $@

tmp/%/heroku/README.md: README.md
	cp $< $@

tmp/%/heroku/CHANGELOG: CHANGELOG
	cp $< $@

tmp/%/heroku/lib/cacert.pem: resources/cacert.pem
	cp $< $@

SOURCEDIR=.
SOURCES := $(shell find $(SOURCEDIR) -name '*.go')
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Channel=$(CHANNEL) -X=main.GitSHA=$(REVISION) -X=main.NodeVersion=$(NODE_VERSION) -X=main.NpmVersion=$(NPM_VERSION)"
tmp/darwin-%/heroku/bin/heroku: GOOS=darwin
tmp/linux-%/heroku/bin/heroku:  GOOS=linux
tmp/%-amd64/heroku/bin/heroku:  GOARCH=amd64
tmp/%-386/heroku/bin/heroku:    GOARCH=386
tmp/%/heroku/bin/heroku: $(SOURCES)
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build $(LDFLAGS) -o $@

$(DIST_DIR)/heroku-v$(VERSION)-%.tar.xz: $(VERSIONS)
	@mkdir -p $(@D)
	tar -C tmp/$* -c heroku | xz > $@

.PHONY: build
build: $(WORKSPACE)/bin/heroku $(WORKSPACE)/lib/plugins.json

.PHONY: clean
clean:
	rm -rf tmp dist $(CACHE_DIR)

.PHONY: test
test: build
	$(WORKSPACE)/bin/heroku version
	$(WORKSPACE)/bin/heroku plugins
	$(WORKSPACE)/bin/heroku status

.PHONY: all
all: $(VERSIONS)

DIST_TARGETS := $(foreach target, $(TARGETS), $(DIST_DIR)/heroku-v$(VERSION)-$(target).tar.xz)
.PHONY: dist
dist: $(DIST_TARGETS)

NODES = node-v$(NODE_VERSION)-darwin-x64.tar.gz \
node-v$(NODE_VERSION)-linux-x64.tar.gz \
win-x64/node.exe
NODE_TARGETS := $(foreach node, $(NODES), $(CACHE_DIR)/node-v$(NODE_VERSION)/$(node))
.PHONY: deps
deps: $(NPM_ARCHIVE) $(NODE_TARGETS)

.DEFAULT_GOAL=build
.SECONDARY:
