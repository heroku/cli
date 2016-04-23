NPM_VERSION=3.8.7
NODE_VERSION=5.11.0
WORKSPACE=tmp/heroku

NODE_BASE=node-v$(NODE_VERSION)-darwin-x64
NODE_PATH=$(WORKSPACE)/lib/$(NODE_BASE)
NPM_PATH=$(WORKSPACE)/lib/npm-$(NPM_VERSION)

VERSION=`./bin/version`
REVISION=`git log -n 1 --pretty=format:"%H"`
CHANNEL=`git rev-parse --abbrev-ref HEAD`
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Channel=$(CHANNEL) -X=main.GitSHA=$(REVISION) -X=main.NodeVersion=$(NODE_VERSION) -X=main.NodeBase=$(NODE_BASE) -X=main.NpmVersion=$(NPM_VERSION)"

SOURCEDIR=.
SOURCES := $(shell find $(SOURCEDIR) -name '*.go')

BINARY=$(WORKSPACE)/bin/heroku-cli

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
	mkdir -p $(@D)
	curl -Lso $@ https://github.com/npm/npm/archive/v$(NPM_VERSION).tar.gz

$(NPM_PATH): $(NPM_ARCHIVE)
	mkdir -p $(@D)
	tar -C $(@D) -xzf $(NPM_ARCHIVE)
	touch $@

NODE_MODULES=$(WORKSPACE)/lib/node_modules
$(NODE_MODULES): $(BINARY) package.json
	cp package.json $(@D)/package.json
	$(BINARY) setup

$(BINARY): $(SOURCES) $(NPM_PATH) $(NODE_PATH)
	go build $(LDFLAGS) -o $(BINARY)

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

.DEFAULT_GOAL=build
