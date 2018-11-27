// This file builds the abstract.js file. Not needed upstream.

fs = require('fs');
publications = require("./publications.json");

var data = `function showAbstract(key) {
    var ele = document.getElementById(key);
    if(ele.style.display == "block") {
        ele.classList.remove("fadeIn");
        ele.classList.add("fadeOut");
        setTimeout(function() {ele.style.display = "none"; ele.classList.remove("animated","fadeOut");}, 500);
    }
    else {
        ele.style.display = "block";
        ele.classList.add("animated","fadeIn");
    }
}

document.addEventListener( "DOMContentLoaded", ready, false );

function ready() {
`;

publications.forEach(function(pub) {
    if (pub.type == "article-journal") {
        key = pub.DOI
    } else {
        key = pub.publisher
    };
    data += `document.getElementById('${pub.id}').onclick = function () { showAbstract('${key}'); };
    `;
});

data += `}
`;

fs.writeFile("src/abstract.js", data, function(err) {
    if(err) {
        return console.log(err);
    }
});
