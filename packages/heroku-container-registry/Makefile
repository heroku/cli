link:
	heroku plugins:link "$(shell pwd)"

unlink:
	heroku plugins:uninstall heroku-container-tools

patch:
	npm version patch
	git push
	npm publish
