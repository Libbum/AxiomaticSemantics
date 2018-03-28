+++
title = "Coloured Tables for the Memoir Class"
description = "So long as that colour isn't yellow. I hate yellow."
tags = ["LaTeX"]
date = 2014-11-16
aliases = ["/posts/2014-11-16-coloured-tables-for-the-memoir-class.html"]
[extra]
banner = "type"
+++

If you're a fan of **LaTeX** typography, you may have come across the [Motion Mountain](http://www.motionmountain.net/) set of physics textbooks.
This long term project has its own class file, which has been tweaked and honed over many years, has seen many of its pages grace many typography showcases (not to mention commercial successes and other recognitions).
One particular stylistic choice that piqued my interest was the use of coloured rules inside the `\table{}` environment.

There _colortbl_ package (available on [CTAN](http://www.ctan.org/tex-archive/macros/latex/contrib/colortbl/)), with albeit hideous examples, allows for the inclusion of colour into tables; usually to highlight cells, but with a bit of finesse can be persuaded to alter the rule colour also.

<!-- more -->
[Memoir](http://www.ctan.org/tex-archive/macros/latex/contrib/memoir) is by far the most comprehensive class I've come across that should be the default document choice for those wishing to typeset large and complex documents.
Simply adding _colortbl_ into the preamble of ones document will allow access to the capability needed to obtain coloured table rules, but this is not the only option available.
Memoir incorporates the extensions from [booktabs](http://www.ctan.org/tex-archive/macros/latex/contrib/booktabs), which provides much needed enhancements to the default table environment.
Since _booktabs_ has some rudimentary support for _colortbl_, Memoir already has latent colour capability from the ported legacy code&mdash;it just needs to be enabled.

Add this to your preamble:
``` latex
    \makeatletter
    \def\rulecolor#1#{\CT@arc{#1}}
    \def\CT@arc#1#2{%
      \ifdim\baselineskip=\z@\noalign\fi
      {\gdef\CT@arc@{\color#1{#2}}}}
    \let\CT@arc@\relax
    \makeatother
```

And set table rules via `\rulecolor{color}`.
With a little bit of tweaking, your tables will scrub up quite well.

{{ figure(src="table.png", caption="A Memoir class table with coloured horizontal rules") }}
