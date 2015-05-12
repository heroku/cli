link:
	heroku plugins:link "$(shell pwd)"

unlink:
	heroku plugins:uninstall heroku-docker

patch:
	npm version patch
	git push
	npm publish
