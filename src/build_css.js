const purify = require("purify-css")

var content = ['public/js/*.js', 'public/**/*.html'];
var css = ['public/main.css'];

var options = {
    // Will write purified CSS to this file.
    output: 'public/main.css',
    // Will minify CSS code in addition to purify.
    minify: true,
    // Logs out removed selectors.
    rejected: true,
    // Ignores
    whitelist: ['*isso*']
};

purify(content, css, options);
