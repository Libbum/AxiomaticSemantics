js:
	uglifyjs --compress --mangle -o static/js/axiomatic.js src/jquery.min.js src/skel.min.js src/util.js src/main.js
	uglifyjs --compress --mangle -o static/js/abstract.js src/abstract.js

