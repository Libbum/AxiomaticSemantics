JSTARGETS := static/js/axiomatic.js static/js/abstract.js

.PHONY: clean rebuild deploy js

static/js/axiomatic.js:
	uglifyjs --compress --mangle -o static/js/axiomatic.js src/jquery.min.js src/skel.min.js src/util.js src/main.js

static/js/abstract.js:
	uglifyjs --compress --mangle -o static/js/abstract.js src/abstract.js

js: $(JSTARGETS)

build: $(JSTARGETS)
	gutenberg build

rebuild: clean build

serve: $(JSTARGETS)
	gutenberg serve

deploy: build
	rsync -avr --chown=www-data:www-data --checksum --exclude 'keybase.txt' --delete -e ssh public/ AkashaR:axiomatic/

clean:
	@-rm -f $(JSTARGETS)
