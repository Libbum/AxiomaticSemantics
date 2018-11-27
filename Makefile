JSTARGETS := static/js/axiomatic.js static/js/abstract.js
SEARCHTARGETS := src/elasticlunr.min.js src/search_index.en.js
AXTARGETS := src/jquery.min.js src/skel.min.js src/util.js src/main.js src/search.js

.PHONY: clean rebuild deploy js

search:
	zola -c config.search.toml build
	mv public/elasticlunr.min.js src
	mv public/search_index.en.js src

static/js/axiomatic.js: $(AXTARGETS) $(SEARCHTARGETS)
	uglifyjs --compress --mangle -o static/js/axiomatic.js src/jquery.min.js src/skel.min.js src/util.js src/main.js src/elasticlunr.min.js src/search.js src/search_index.en.js

src/abstract.js:
	node src/build_abstract.js

static/js/abstract.js: src/abstract.js
	uglifyjs --compress --mangle -o static/js/abstract.js src/abstract.js

js: $(JSTARGETS)

build: $(JSTARGETS)
	zola build

rebuild: clean search build

serve: $(JSTARGETS)
	zola serve

deploy: search build
	rsync -avr --chown=www-data:www-data --checksum --exclude 'keybase.txt' --delete -e ssh public/ AkashaR:axiomatic/

clean:
	@-rm -f $(JSTARGETS)
