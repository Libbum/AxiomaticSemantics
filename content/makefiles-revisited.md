+++
title = "Makefiles Revisited"
description = "The rabbit hole keeps getting deeper and deeper. But I like what they've done with the place..."
tags = ["make", "LaTeX"]
date = 2015-04-09
aliases = ["/posts/2015-04-09-makefiles-revisited.html"]
+++

Writing a thesis. Writing at home, writing at uni, at work, on planes, on machines half way across the planet with Swedish keyboards attached to them. The amount of computers that have my __git__ repository cloned on it is either impressive or terrifying depending on how you look at it. One positive thing about my tree is that a good 90&ndash;95% of my ridiculous figure count has been built in Ti*k*z / PGFPlots. Totally source control friendly, small and portable.

<!-- more -->

What hasn't been that nice about it are the few binary dependencies I keep forgetting to track or that nasty little bug that __xelatex__ has wherein it just utterly fails when you try and draw a gradient or any form of shading. To overcome this issue I've been running a two step compile process, where figures that require shading are built using __pdflatex__, then if text is required (for labels or annotations for example), __xelatex__ is called. This allows the figure font to remain homologous with the main text and the pre-rendered shaded geometry can be simply imported with some form of `\includegraphics{}` command.

However the figure count is now over 50 and climbing, so building all of them on a new machine or propagating broad changes has become a cumbersome task. Ever since writing my first [Makefile](/unveiling-some-makefile-black-magic), I've enjoyed making simple ones for menial tasks. Nothing fancy, but useful enough to take the time and understand the syntax just that little bit more. Building these figures was an obvious case for some new `Makefile` magic.

Here's what I came up with on a train to Bendigo with two random obnoxious children crawling over me:

``` makefile
    #All files to be built with pdflatex
    PSOURCES := aluminium.tex emegir.tex flourish.tex jjschematic.tex oxygen.tex \\
                                oxygenb.tex qabuum.tex sf.tex sio2.tex
    #All files to be built with xelatex
    XSOURCES := $(filter-out $(PSOURCES), $(wildcard *.tex))
    PTARGETS := $(PSOURCES:.tex=.pdf)
    XTARGETS := $(XSOURCES:.tex=.pdf)
    PDFLATEX := pdflatex --shell-escape --extra-mem-top=10000000 --save-size=80000
    XELATEX := xelatex --shell-escape --extra-mem-top=10000000 --save-size=80000

    .PHONY: all clear rebuild clean distclean

    all: xelatex

    pdflatex: $(PTARGETS)

    xelatex: $(XTARGETS)

    %.pdf: %.tex
            @[ '$<' == '$(findstring $<,$(PSOURCES))' ] && $(PDFLATEX) $< || $(XELATEX) $<
            @[ '$<' == '$(findstring $<,$(PSOURCES))' ] && $(PDFLATEX) $< || $(XELATEX) $<

    #Dependencies
    $(XTARGETS): AGS.pdf BGS.pdf $(PTARGETS)
    $(PTARGETS): sf.tikz

    rebuild: clean all

    clear:
            @-rm -f *.aux *.log *.dat

    clean: clear
            @-rm -f $(PTARGETS) $(XTARGETS)

    distclean: clean
```

There are a few interesting things in here that weren't obvious to me at first. For instance the wildcard property allows a list of some input file type to be made into an output file of the same name. The target `%.pdf: %.tex` says that all output pdf files will require a corresponding tex file. With my particular case this isn't very helpful as I'd like only some tex files rendered to pdf using one method and the rest rendered with a completely different method. Another question I had was "What's the best way to separate the __pdflatex__ and __xelatex__ runs?"

The second issue could have just been two lists that would need to be updated every time a new figure was added, but that seemed to be a little inefficient and defeat the purpose of the makefiles' automation. The solution comes from this line:

``` makefile
    $(filter-out $(PSOURCES), $(wildcard *.tex))
```
which takes the list `$(wildcard *.tex)` and filters (removes) any matches from `$(PSOURCES)`. The `wildcard` command is necessary here to identify this list as iterable for the `%.tex` target later on. As the sources for the __pdflatex__ run are far fewer than those needing the default __xelatex__ treatment, it's much easier to filter the exceptions at this juncture. Now all new files that don't require special treatment also don't require any thought when building them.

Separating the two build types became a bit more of a hassle. Initially, I'd implemented something like

``` makefile
    ifeq ($<,$(findstring $<,$(PSOURCES)))
        $(PDFLATEX) $<
        $(PDFLATEX) $<
    else
        $(XELATEX) $<
        $(XELATEX) $<
    endif
```

for the `%.pdf: %.tex` target.

``` makefile
    $(findstring $<,$(PSOURCES))
```

is tasked to find the current tex file during the expansion of the `%.tex` wildcard (`$<`) in the `$(PSOURCES)` list. If the file isn't in the list this function will return an empty string and the `ifeq ($<, "")` test will return false. But this never worked and all files ended up trying to compile with __pdflatex__. Without internet and these kids still crawling over me, I gave up in disgust and stared out the window for the rest of the trip.

Later, back in civilisation, I pulled up the __make__ documentation and found out why this method was bound to fail: __make__ evaluates conditionals when it reads a makefile

> A __conditional__ causes part of a makefile to be obeyed or ignored depending on the values of variables. Conditionals can compare the value of one variable to another, or the value of a variable to a constant string. Conditionals control what make actually "sees" in the makefile, so they cannot be used to control shell commands at the time of execution.

In other words, a first pass of the file will test the `ifeq` condition, then choose that option for the second (and final) pass. When the second pass meets the wildcard expansion it just inserts whatever commands the first pass sends it and that's all she wrote. So the solution I required here was to export the problem to the shell each wildcard expansion, test the name of the current .tex file and only then invoke the correct compile tool.

All in all, this file does quite a good job. I haven't seen many people discussing their figure build chain online, so if you have an interesting way of making your figures get in contact&mdash;I'd be interested to know what you do.
