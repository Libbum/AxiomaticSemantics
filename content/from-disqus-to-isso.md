+++
title = "From Disqus to Isso"
description = "Current comment security is a sad state of affairs."
date = 2017-04-16
aliases = ["/posts/2017-04-16-from-disqus-to-isso.html"]
[taxonomies]
tags = ["JavaScript", "Security"]
[extra]
banner = "timepc"
+++

Due to my erroneous assumption that an OVZ container is indistinguishable from a full OS on the inside, my VPS upgrade from Debian Wheezy to Jessie didn't go exactly as planned&hellip;

Starting from a clean install I went about revamping a number of things, as well as keeping on top of the new security measures that have been added to the [observatory](https://observatory.mozilla.org) in the past six months.

I love static sites and have no use for too much dynamic frivolity, which also means I can tighten up security policies so my server is (hopefully) more of a vault with an excellent CCTV system for you all to look inside with.
But comments on this blog have been an issue.
[Disqus](https://disqus.com) has been a necessary evil since this blog's inception, but both my own and the worries of the [internets](https://stiobhart.net/2017-02-21-disqusting/) are something that needed tending to.

<!-- more -->

Just look at this CSP header!

```
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://axiomatic.disqus.com https://api.github.com https://d3js.org https://code.jquery.com https://cdnjs.cloudflare.com https://a.disquscdn.com https://ajax.googleapis.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://a.disquscdn.com; img-src 'self' data: https://referrer.disqus.com https://a.disquscdn.com https://i.creativecommons.org https://licensebuttons.net; frame-src 'self' https://disqus.com";
```

Apart from a few CDN and API links (github, d3js and cloudflare) this is all to satiate Disqus, and even then you could watch the developer console in Chrome and see it still bash up against the policy.
I've never had any of the advertising integration turned on either, so I'd hate to see what happened if I was that kind of asshole.

So I've taken the plunge and moved to [Isso](https://posativ.org/isso/): a self hosted alternative which requires no login (can be anonymous if you wish), no external services, no bullshit.
Well, that last one is only partially true unfortunately.
Take a look at my CSP now:

```
add_header Content-Security-Policy "default-src 'self'; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-eval' https://api.github.com https://d3js.org https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'";
```

Much better; but notice anything suspect? There's one `eval` in the code-base which means putting in an `unsafe-eval` and dropping 15 points from my Observatory score.

[#274](https://github.com/posativ/isso/issues/274) highlights this and it's not an easy fix.
The commenting system relies on an old version of [pug.js](https://pugjs.org/api/getting-started.html) to do the templating (back when it was called jade) and thus needs a major overhaul to fix.
So for the moment I've managed to swap implicit problems with Disqus to an explicit issue with Isso.
Even so, this is an issue that is in my power to fix, when (read: if) I have the time.

The moderation system requires an `unsafe-inline` in `script-src` to allow one click acceptance or deletion of a comment via an email notification you receive once someone posts.
This, in addition to the eval issue just wont fly with me; but at this point I had already come too far.
The solution is quite straightforward though: just edit the comment database directly.

``` sql
select * from comments where mode = 2;
update comments set mode = 1 where id = 28;
  **OR**
delete from comments where id = 28;
```

Here, `mode = 2` means awaiting approval (`1` is live), and the `id` is a comment you wish to approve or deny.
A lazy (savvy) user may also script an ssh connection, sqlite connection, and a somewhat modified query/action to generate one click acceptance and deletion links they could replace in their notification emails.

---

Security gripes aside, Isso is quite nice and built close to my principles concerning the current state of the Web.
Initially I thought [Gravatar](https://secure.gravatar.com/) integration would be nice, but now I like the philosophy behind the identicon.
Running an sqlite back-end makes sense.
The moderation gate minimises spam intake and doesn't require a hefty Bayesian parser hogging my cycles.
Markdown in comments. *etc*.

The code-base is also small enough to hack on, and add quick and dirty additions.
One particular thing I missed from Disqus was the obvious **author** attribute to comments.
For the moment each Isso user looks the same&mdash;this is fine for a Marxist utopia, but I'm the one yielding what little power I have over this small portion of the web and I intend to let that be known.

You can see in [comment.jade](https://github.com/posativ/isso/blob/d37b5bb030701a601854e463c1789325084ce10b/isso/js/app/text/comment.jade) that if we have the avatar system on, Isso generates an identicon for each comment from the `comment.hash`.
This is a PBKDF2 hash generated from either the email address or IP of the user.

``` javascript
div(class='isso-comment' id='isso-#{comment.id}')
    if conf.avatar
        div(class='avatar')
            svg(data-hash='#{comment.hash}')
    div(class='text-wrapper')
        div(class='isso-comment-header' role='meta')
```

Since this is a hack job, I just identified mine from a comment I had already created, then modified the above to add an additional class if my hash matched the current one the template is processing:

``` javascript
div(class='isso-comment' id='isso-#{comment.id}')
    if conf.avatar
        div(class='avatar')
            svg(data-hash='#{comment.hash}')
    div(class=(comment.hash == '213ac8a3c887') ? 'text-wrapper author-highlight' : 'text-wrapper')
        div(class='isso-comment-header' role='meta')
```

and wrote an appropriate style

``` css
.author-highlight {
￼    background-color: rgba(200, 200, 200, 0.4);
￼    border-top-right-radius: 25px;
￼    border-bottom-right-radius: 25px;
}
```

At some stage soon I'll put together a pull request to add something similar to Isso directly, but that will probably require an addition to the configuration file. Allowing the author to identify themselves without the above hassle.
To see this in action, perhaps take a look at [one of the only actual comment sections on this website](@/converting-4k-content-for-samsung-uhd-televisions.md).
And yes: the fact that I've just ranted about commenting systems without having much use of a comment system at all does not escape me.
Perhaps my readers don't care for Disqus more-so than I?

---

**Update April 21, 2017**

I actually managed to build this [pull request](https://github.com/posativ/isso/pull/321) much quicker than I anticipated.
This is a fully functional blog author highlighting system&mdash;a little different than the one I've written about above, but much less of a hack job.

