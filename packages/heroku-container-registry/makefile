link:
	heroku plugins:uninstall heroku-docker || true
	mkdir -p ~/.heroku/node_modules
	ln -s "$(shell pwd)" ~/.heroku/node_modules/

unlink:
	unlink ~/.heroku/node_modules/$(shell basename $(shell pwd))
