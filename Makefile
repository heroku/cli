NPM_VERSION=3.8.7
NODE_VERSION=5.11.0

TARGETS=darwin-amd64 linux-amd64

VERSION=$(shell ./bin/version)
REVISION=$(shell git log -n 1 --pretty=format:"%H")
CHANNEL=$(shell git rev-parse --abbrev-ref HEAD)

GOOS=$(shell go env GOOS)
GOARCH=$(shell go env GOARCH)
WORKSPACE=tmp/$(GOOS)-$(GOARCH)

NODE_BASE=node-v$(NODE_VERSION)-$(NODE_OS)-$(NODE_ARCH)
tmp/darwin-%/lib/node-$(NODE_VERSION): NODE_OS=darwin
tmp/linux-%/lib/node-$(NODE_VERSION):  NODE_OS=linux
tmp/%-amd64/lib/node-$(NODE_VERSION):  NODE_ARCH=x64
tmp/%-386/lib/node-$(NODE_VERSION):    NODE_ARCH=x86
tmp/%/lib/node-$(NODE_VERSION):
	mkdir -p $(@D)
	curl -Lso tmp/$(NODE_BASE).tar.gz https://nodejs.org/dist/v$(NODE_VERSION)/$(NODE_BASE).tar.gz
	tar -C tmp -xzf tmp/$(NODE_BASE).tar.gz
	mv tmp/$(NODE_BASE)/bin/node $@
	rm -rf tmp/$(NODE_BASE)*

NPM_ARCHIVE=tmp/npm-v$(NPM_VERSION).tar.gz
$(NPM_ARCHIVE):
	mkdir -p $(@D)
	curl -Lso $@ https://github.com/npm/npm/archive/v$(NPM_VERSION).tar.gz
tmp/%/lib/npm-$(NPM_VERSION): $(NPM_ARCHIVE)
	mkdir -p $(@D)
	tar -C $(@D) -xzf $(NPM_ARCHIVE)
	touch $@

$(WORKSPACE)/lib/plugins.json: $(WORKSPACE)/bin/heroku package.json $(WORKSPACE)/lib/npm-$(NPM_VERSION) $(WORKSPACE)/lib/node-$(NODE_VERSION)
	mkdir -p $(@D)
	cp package.json $(@D)/package.json
	$(WORKSPACE)/bin/heroku setup

tmp/%/lib/plugins.json: $($(WORKSPACE)/lib/plugins.json)
	cp $(WORKSPACE)/lib/plugins.json $@
	cp $(WORKSPACE)/lib/package.json $(@D)/package.json
	cp -r $(WORKSPACE)/lib/node_modules $(@D)

tmp/%/VERSION: tmp/%/bin/heroku tmp/%/lib/npm-$(NPM_VERSION) tmp/%/lib/node-$(NODE_VERSION) tmp/%/lib/plugins.json bin/version
	echo $(VERSION) > $@

SOURCEDIR=.
SOURCES := $(shell find $(SOURCEDIR) -name '*.go')
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Channel=$(CHANNEL) -X=main.GitSHA=$(REVISION) -X=main.NodeVersion=$(NODE_VERSION) -X=main.NodeBase=$(NODE_BASE) -X=main.NpmVersion=$(NPM_VERSION)"
tmp/darwin-%/bin/heroku: GOOS=darwin
tmp/linux-%/bin/heroku:  GOOS=linux
tmp/%-amd64/bin/heroku:  GOARCH=amd64
tmp/%-386/bin/heroku:    GOARCH=386
tmp/%/bin/heroku: $(SOURCES)
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build $(LDFLAGS) -o $@

.PHONY: build
build: $(WORKSPACE)/bin/heroku $(WORKSPACE)/lib/plugins.json

.PHONY: clean
clean:
	rm -rf tmp dist

.PHONY: test
test: build
	$(WORKSPACE)/bin/heroku version
	$(WORKSPACE)/bin/heroku plugins
	$(WORKSPACE)/bin/heroku status

VERSIONS := $(foreach target, $(TARGETS), tmp/$(target)/VERSION)
.PHONY: all
all: $(VERSIONS)

VERSIONS := $(foreach target, $(TARGETS), tmp/$(target)/VERSION)
.PHONY: dist
dist: $(foreach target, $(TARGETS), dist/$(target).tar.xz)

.DEFAULT_GOAL=build
.SECONDARY:
