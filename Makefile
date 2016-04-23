NPM_VERSION=3.8.7
NODE_VERSION=5.11.0

WORKSPACE=tmp/heroku
TARGETS=dist/darwin-amd64 dist/linux-amd64
BINARY=$(WORKSPACE)/bin/heroku-cli

VERSION=`./bin/version`
REVISION=`git log -n 1 --pretty=format:"%H"`
CHANNEL=`git rev-parse --abbrev-ref HEAD`

NODE_BASE=node-v$(NODE_VERSION)-darwin-x64
NODE_PATH=$(WORKSPACE)/lib/$(NODE_BASE)
NODE_ARCHIVE=$(WORKSPACE)/$(NODE_BASE).tar.gz
$(NODE_PATH):
	mkdir -p $(@D)
	curl -Lso $(NODE_ARCHIVE) https://nodejs.org/dist/v$(NODE_VERSION)/$(NODE_BASE).tar.gz
	tar -C $(WORKSPACE) -xzf $(NODE_ARCHIVE)
	rm $(NODE_ARCHIVE)
	mv $(WORKSPACE)/$(NODE_BASE)/bin/node $@
	rm -rf $(WORKSPACE)/$(NODE_BASE)

NPM_ARCHIVE=tmp/npm-v$(NPM_VERSION).tar.gz
$(NPM_ARCHIVE):
	curl -Lso $@ https://github.com/npm/npm/archive/v$(NPM_VERSION).tar.gz

NPM_PATH=$(WORKSPACE)/lib/npm-$(NPM_VERSION)
$(NPM_PATH): $(NPM_ARCHIVE)
	tar -C $(@D) -xzf $(NPM_ARCHIVE)
	touch $@

NODE_MODULES=$(WORKSPACE)/lib/node_modules
$(NODE_MODULES): $(BINARY) package.json
	cp package.json $(@D)/package.json
	$(BINARY) setup

SOURCEDIR=.
SOURCES := $(shell find $(SOURCEDIR) -name '*.go')
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Channel=$(CHANNEL) -X=main.GitSHA=$(REVISION) -X=main.NodeVersion=$(NODE_VERSION) -X=main.NodeBase=$(NODE_BASE) -X=main.NpmVersion=$(NPM_VERSION)"
$(BINARY): $(SOURCES) $(NODE_PATH) $(NPM_PATH)
	go build $(LDFLAGS) -o $(BINARY)

#dist/%: build

.PHONY: build
build: $(NODE_MODULES)

.PHONY: clean
clean:
	rm -rf tmp dist

.PHONY: test
test: build
	$(BINARY) version
	$(BINARY) plugins
	$(BINARY) status

.PHONY: all
all: build $(TARGETS)

.DEFAULT_GOAL=build
