+++
title = "Automatic Publication Lists for Zola"
description = "New name, new tricks, new templates. Same old list."
date = 2018-11-27
[taxonomies]
tags = ["JavaScript", "Zola", "Tera"]
[extra]
banner = "map"
+++

It's been a while since I last [ranted about publication lists](/generating-a-publication-list-from-mulitple-orcids/), so let's go ahead and see if we can't re-solve this non-issue in a different context.
The [papers](/papers/) section of this blog has always been manually updated. Back in the [Hakyll](https://jaspervdj.be/hakyll/) days [there was an attempt](https://github.com/Libbum/AS-Hakyll/commit/28a471d594f31a80995ee06101fd6a2375b684ad) to rectify this, but it caused no end of frustration.
Gutenberg's system didn't really allow for an automated process either, so the whole idea had been shelved indefinitely.

<!-- more -->

The most recent version of Gutenberg has had a number of important updates to it, most notably a name change to [Zola](https://www.getzola.org/), but importantly for the purposes of this post&mdash;**Data files**.

The `load_data` function supports *toml*, *json* and *csv* formats, which populates a [Tera](https://tera.netlify.com/) data structure ready to template.
So, not exactly what we need if we want to be parsing *bib* files&hellip;

---

[Zotero](https://www.zotero.org/) has been my publication manager for about a year now, and can happily say it is an order of magnitude better than any other manager out there.
Not only that, its plugin ecosystem rocks.
Specifically [BetterBibTeX](https://www.zotero.org/) is fantastic, and it holds the keys to our automation solution.

Using BetterBibTeX under Zotero, you can export a *selective* collection of publications to file.
This file is tracked and is *automatically updated* every time your collection is altered.
In addition, BetterBibTeX supports a number of output formats, one being `CSL JSON`.

The `CSL` standard is a tad awkward in some ways, but mostly suits our purposes here.
Exporting a tracked file into our blog's `src` directory, we're good to get started.

## Building the template

First, we load our data using

```Jinja2
{% set pubs = load_data(path="src/publications.json") %}
```

then, generate our publication list by iterating over `pubs`:

```Jinja2
<ul>
{% for publication in pubs | filter(attribute="type", value="article-journal") | sort(attribute="sort") | reverse %}
  <li class="pub-item">
    <div class="pub-title">{{ publication.title | safe }}</div>
    <div class="pub-authors">{{ self::authors(list=publication.author) }}</div>
    <div class="pub-details">
      <a href="https://doi.org/{{ publication.DOI }}">
        <span class="pub-journal">{{ publication["container-title"] }}</span>
        <span class="pub-vol">{{ publication.volume }}</span> {{ publication.page }} ({{ publication.issued["date-parts"].0.0 }})
      </a>
    </div>
    <span class="pub-links">[<button id="{{ publication.id }}" class="abstractlink">Abstract</button>, <a href="{{ publication.URL }}">PDF</a>]</span>
    <div id="{{ publication.DOI }}" class="abstract">{{ publication.abstract | safe }}</div>
  </li>
{% endfor %}
</ul>
```

The specifics for you will differ, but this represents almost everything you need.
Let's take a look at some of that in detail.

The `for` loop initially `filter`s the content to only accept *article-journal* type items.
This is so we can separate collections of pre-prints (for example, books may be another) into another list.
Sorting is on an attribute named *sort*, which for those of you familiar with `CSL` may look odd.
Unfortunately Tera's sorting capabilities aren't as strong as CSL's date handling is odd&mdash;see further down, there's `publication.issued["date-parts"].0.0`?
That's how deep the publication year is hidden.
Tera will sort on numbers, strings, bools and arrays; but not nested chaos like this.
Therefore, this little *sort* hack needed to be implemented.

### Appending a sorting value to the CSL output

In BetterBibTeX's advanced options, we are able to apply a [postscript](https://retorque.re/zotero-better-bibtex/scripting/) to the parser.
Since date is all we want to sort on, it's a simple manner of getting the date values from Zotero and giving Tera an appropriate number.

```Typescript
if (Translator.BetterCSLJSON) {
  let date = Zotero.BetterBibTeX.parseDate(item.date);
  reference.sort = (date.year*10000)+(date.month*100)+date.day;
}
```

**Side note:** I felt pretty chuffed when I realised I needed daily precision to get my order correct.

### Printing an Author List

CSL's handling of authors is not actually that bad, but it's cumbersome to work with in a template.
A list of names, separated by *given* and *family* is what we must connect in a sane manner.

To do this, a macro is the best bet, which in general is quite straightforward&mdash;provided you look out for the edge cases.
```Jinja2
{% macro authors(list) %}
{% set authors = "" %}
{% for name in list %}
  {% if loop.first %}
    {% set prev = authors %}
  {% elif loop.last %}
    {% set prev = authors ~ " and " %}
  {% else %}
    {% set prev = authors ~ ", " %}
  {% endif %}
  {% set_global authors = prev ~ name.given ~ " " ~ name.family %}
{% endfor %}
{{ authors }}
{% endmacro authors %}
```
## Implementing the Button Action

An extra addition I like to have in my list is the ability for readers to browse the abstract of each paper without having the whole thing cluttering up the list.
To that end, a little bit of javascript shows/hides each abstract when the user clicks on a button.
The [old, manual implementation](https://github.com/Libbum/AxiomaticSemantics/blob/dd9b7a5117a01e9470bb855593c8dbb85f6265ec/src/abstract.js) of this script added `onclick` events to each button, which I continuously forgot to update when adding a new paper to the list.

Now, a [node](https://nodejs.org) script generates this section automatically:
```javascript
publications = require("./publications.json");

publications.forEach(function(pub) {
    if (pub.type == "article-journal") {
        key = pub.DOI
    } else {
        key = pub.publisher
    };
    data += `document.getElementById('${pub.id}').onclick = function () { showAbstract('${key}'); };
    `;
});
```

where `data` is a template literal holding the entire script, which is written to file once fully constructed.
The `pub.type` check here is again for the pre-print separation portion, so each publication type can be handled in its own unique manner.

## Alternative Lists

A pre-print list has been eluded to a few times now, so for completeness, here is how I handle **arXiv** citations.
Since there is no correct/complete/nice way to store arXiv papers in most managers, I take some liberties with the particulars here.

```Jinja2
<ul class="alt">
{% for publication in pubs | filter(attribute="type", value="article") | sort(attribute="sort") | reverse %}
  <li class="pub-item">
    <div class="pub-title">{{ publication.title | safe }}</div>
    <div class="pub-authors">{{ self::authors(list=publication.author) }}</div>
    <div class="pub-details"><a href="{{ publication.URL }}"><span class="pub-journal">{{ publication.source }}</span> {{ publication.publisher }}</a></div>
    <span class="pub-links">[<button id="{{ publication.id }}" class="abstractlink">Abstract</button>, <a href="https://arxiv.org/pdf/{{ publication.publisher }}">PDF</a>]</span>
    <div id="{{ publication.publisher }}" class="abstract">{{ publication.abstract | safe }}</div>
  </li>
{% endfor %}
</ul>
```

Same overall setup, although I set the *type* to *Document* in Zotero, which gives us *article* as a value to filter on here.
Additionally, `publication.source` is set to **arXiv** and `publication.publisher` is the arXiv document ID.
That last one is a bit hacky, but it keeps us inline with CSL and doesn't require any additional postscripts.

## Set and Forget

Finally, putting this all together is a simple matter of adding the button script as a target in the Makefile.

```Makefile
src/abstract.js: src/publications.json src/build_abstract.js
    node src/build_abstract.js

static/js/abstract.js: src/abstract.js
    uglifyjs --compress --mangle -o static/js/abstract.js src/abstract.js
```

The static file target has always been there, and would fire every time I manually edited `src/abstract.js`.
Now, anytime the site is built and I've updated my library in Zotero, the abstract file is generated, and the template churns out the list&mdash;absolutely no additional interaction is required.
The only caveat to that is that I've set the whole system up to fail if something is missing, like a complete date for example.
In that sense, everything is smooth sailing if the library is properly sanitised.

---

All in all I'm happy that this is finally something I never need to deal with again.
Stay tuned for my 2021 post where I totally deal with this again.
