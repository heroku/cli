MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

NODE_VERSION?=6.3.0
CACHE_DIR?=tmp/cache
CHANNEL?=dev

version := $(shell node -p "require('./package.json').version")
dist_dir?=dist/$(version)

.PHONY: all
all: build

.PHONY: build
build: build-darwin

.PHONY: clean
clean:
	rm -rf dist

.PHONY: build-darwin build-darwin-x64
build-darwin: build-darwin-x64
build-darwin-x64: $(dist_dir)/node_modules/.bin/heroku
	$(MAKE) $(dist_dir)/heroku-darwin-x64-$(version).tar.xz OS=darwin ARCH=x64

$(dist_dir)/node_modules/.bin/heroku:
	rm -rf $(dist_dir)/node_modules
	mkdir -p $(@D)
	cd $(dist_dir) && npm install heroku-cli

$(dist_dir)/$(OS)-$(ARCH)/heroku/lib/node_modules/.bin/heroku: $(dist_dir)/node_modules/.bin/heroku
	@mkdir -p $(@D)
	cp -r $(dist_dir)/node_modules $(dist_dir)/$(OS)-$(ARCH)/heroku/lib

$(dist_dir)/heroku-$(OS)-$(ARCH)-$(version).tar.xz: $(dist_dir)/$(OS)-$(ARCH)/heroku/lib/node $(dist_dir)/$(OS)-$(ARCH)/heroku/lib/node_modules/.bin/heroku $(dist_dir)/$(OS)-$(ARCH)/heroku/bin/heroku
	tar -C $(dist_dir)/$(OS)-$(ARCH) -c heroku | xz -2 > $@

$(dist_dir)/$(OS)-$(ARCH)/heroku/bin/heroku:
	@mkdir -p $(@D)
	cp resources/heroku $@

$(CACHE_DIR)/node-v$(NODE_VERSION)/%:
	@mkdir -p $(@D)
	curl -fsSLo $@ https://nodejs.org/dist/v$(NODE_VERSION)/$*

$(dist_dir)/$(OS)-$(ARCH)/heroku/lib/node: $(CACHE_DIR)/node-v$(NODE_VERSION)/node-v$(NODE_VERSION)-$(OS)-$(ARCH).tar.gz
	@mkdir -p $(@D)
	tar -C $(@D) -xzf $<
	cp $(@D)/node-v$(NODE_VERSION)-$(OS)-$(ARCH)/bin/node $@
	rm -rf $(@D)/node-*
	@touch $@
