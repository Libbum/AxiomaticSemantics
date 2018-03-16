js:
	uglifyjs --compress --mangle -o static/js/axiomatic.js src/jquery.min.js src/skel.min.js src/util.js src/main.js
	uglifyjs --compress --mangle -o static/js/abstract.js src/abstract.js

build: js
	gutenberg build

serve: js
	gutenberg serve

deploy: build
	rsync -avr --chown=www-data:www-data --checksum --exclude 'keybase.txt' --delete -e ssh public/ AkashaR:axiomatic/

