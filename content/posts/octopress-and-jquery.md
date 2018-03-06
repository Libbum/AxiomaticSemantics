+++
title = "Octopress and jQuery"
description = "It's always the little things that take hours to figure out"
date = 2013-03-11
tags = ["Octopress", "jQuery"]
aliases = ["/posts/2013-03-11-octopress-and-jquery.html"]
+++

In the process of theming [Axiomatic Semantics](http://axiomatic.neophilus.net), I came across a virtually undocumented (in the Octopress sphere) caveat when including jQuery elements. A number of javascript functions in the Octopress source use `$` as a variable. This is not uncommon; although `jQuery` aliases to `$` - which causes some confusion in the processing of Octopress' functions. My issue was the GitHub aside constantly being stuck at the _Status Updating..._ phase. To overcome this issue, the simplest method is to insert the jQuery include in `after_footer.html`, but if you need the call before then for whatever reason and want it in `head.html`; you're gonna have a bad time.

<!-- more -->

The fix is quite simple:

``` javascript
    $.noConflict()
```

will return control of `$` back to Octopress as old references of `$` are saved during jQuery initialization; `noConflict()` simply restores them for use again. You can read more about it in the [jQuery documentation](http://api.jquery.com/jQuery.noConflict/).

__Note:__ This is not to be confused with the _Status Updating..._ bug that was rectified in Octopress 2.0 when GitHub updated their API to v3. If you're using an older Octopress version, a `rake update_source` should take care of that problem.
