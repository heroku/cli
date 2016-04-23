NPM_VERSION=3.8.7
NODE_VERSION=5.11.0

TARGETS=tmp/darwin-amd64 tmp/linux-amd64

VERSION=$(shell ./bin/version)
REVISION=$(shell git log -n 1 --pretty=format:"%H")
CHANNEL=$(shell git rev-parse --abbrev-ref HEAD)

GOOS=$(shell go env GOOS)
GOARCH=$(shell go env GOARCH)
WORKSPACE=tmp/$(GOOS)-$(GOARCH)

tmp/node/%.tar.gz:
	mkdir -p $(@D)
	curl -Lso $@ https://nodejs.org/dist/v$(NODE_VERSION)/$(@F)

tmp/%/lib/%: tmp/node/%.tar.gz
	mkdir -p $(@D)
	tar -C tmp -xzf tmp/node/$(NODE_BASE).tar.gz
	mv tmp/$(NODE_BASE)/bin/node $@
	rm -rf tmp/$(NODE_BASE)

NPM_ARCHIVE=tmp/npm-v$(NPM_VERSION).tar.gz
$(NPM_ARCHIVE):
	mkdir -p $(@D)
	curl -Lso $@ https://github.com/npm/npm/archive/v$(NPM_VERSION).tar.gz

NODE_MODULES=$(WORKSPACE)/lib/node_modules
$(NODE_MODULES): $(WORKSPACE)/bin/heroku package.json
	cp package.json $(@D)/package.json
	$(WORKSPACE)/bin/heroku setup

SOURCEDIR=.
SOURCES := $(shell find $(SOURCEDIR) -name '*.go')
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Channel=$(CHANNEL) -X=main.GitSHA=$(REVISION) -X=main.NodeVersion=$(NODE_VERSION) -X=main.NodeBase=$(NODE_BASE) -X=main.NpmVersion=$(NPM_VERSION)"
tmp/darwin-amd64/bin/heroku: $(SOURCES)
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o $@
tmp/linux-amd64/bin/heroku: $(SOURCES)
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $@

tmp/%/lib/npm-$(NPM_VERSION): $(NPM_ARCHIVE)
	mkdir -p $(@D)
	tar -C $(@D) -xzf $(NPM_ARCHIVE)
	touch $@

.PHONY: build
build: $(WORKSPACE)/bin/heroku $(WORKSPACE)/lib/$(NODE_BASE) $(WORKSPACE)/lib/npm-$(NPM_VERSION)

.PHONY: clean
clean:
	rm -rf tmp dist

.PHONY: test
test: build
	$(WORKSPACE)/bin/heroku version
	$(WORKSPACE)/bin/heroku plugins
	$(WORKSPACE)/bin/heroku status

.PHONY: all
all: build $(TARGETS)

.DEFAULT_GOAL=build
