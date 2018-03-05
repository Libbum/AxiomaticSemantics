+++
title = "Unveiling some Makefile Black Magic"
byline = "Go back to the shadows"
date = 2013-03-28
tags = ["C++", "make"]
aliases = ["/posts/2013-03-28-unveiling-some-makefile-black-magic.html"]
+++

Whilst my higher education started off in the computer science realm, I quickly became disillusioned and, excluding a decent temporal shift, moved more into the physical sciences. Whilst I never finished my CS degree; what I completed gave me an adequate understanding of development life cycles, program design and sufficient competency in __c++__ to get shit done. When I started heavily coding again, forces shunted me towards __Matlab__ and higher level quick and dirty rapid prototyping. As we all know; you can only go so far in this world and I've recently found myself back into the depths with __c__, __fortran__ and even a little __assembly__.

<!-- more -->

Ultimately though, my __c++__ programs never needed to link to external libraries or worry about machine specific configurations the `-o` switch was the only one I needed when calling `gcc` pretty much. Now I'm building <abbr title="Message Passing Interface">MPI</abbr> tools to run on supercomputing clusters that need the highly optimised linear algebra routines; written down by our forefathers in a more civilised age.

I need a Makefile, the file filled with dark arts known only to those with neck beards and ghostly white skin.

Realistically, Makefiles are relatively simple things, but seem to have a stigma associated with them if you're outside the computer science sphere. In fact; here's a quote from my PhD supervisor when I told him about my knowledge gain concerning this post:

> Hehe, careful.  Those that learn how to write makefiles are usually doomed to vanish .... banished to a basement (or IT department of a fortune 500 company) for all eternity.

I guess writing this post and publishing it on the internet is sealing my fate...

The _my first Makefile_ tutorials around the internet are not too bad (take a look at [WLUG](http://www.wlug.org.nz/MakefileHowto) and [Mrbook](http://mrbook.org/blog/tutorials/make/) to get started); but the Black Magic I eluded to in the title of this post is much cooler than just typing `make` instead of `g++ main.cpp interrobang.cpp -o omgwtfbbq`.


### Pre-processor macros

---

The specific problem I needed to overcome was managing one set of code that requires different linking libraries depending on what machine it was running on.

* __Vayu__ uses intel compilers and requires the MKL libraries
* __Trifid__ uses gcc compilers and requires the blas and lapack libraries

Because of these conditions, code in certain files differ. For example, calls to linear algebra routines on __Vayu__ require an `MKL_int` type, whereas the same call on __Trifid__ asks for `int`. A pre-processor macro defining a generalised int type `LP_INT` enables me to overcome this problem. This macro uses an `if-elif-else` formalism to check what machine the code is compiling on and adds additional headers if needed:

``` c
    #if defined(VAYU)

    #include <mkl>
    #define LP_INT MKL_INT

    #elif defined(TRIFID)

    #define LP_INT int

    #else

    #error "One of VAYU or TRIFID must be defined"

    #endif
```

Now, how can we define these `VAYU` and `TRIFID` variables? SUMMON THE MAKEFILE:

``` makefile
    HOST_NAME := $(shell hostname)
    ifeq ($(HOST_NAME),trifid)
    LAPACK = /usr/local/lapack/3.4.2/lib/liblapack.so /usr/local/blas/1.0.248/lib/libblas.so -lm
    LIBS = -L/usr/local/lapack/3.4.2/lib
    CXX = g++ #icpc
    CPPFLAGS += -DTRIFID=1
    else
    INCLUDES += -I$(MKL)/include
    LAPACK = -lmkl_intel_lp64 -lmkl_intel_thread -lmkl_core -liomp5 -lpthread
    LIBS = -L$(MKL)/lib/intel64
    CPPFLAGS += -DVAYU=1
    endif
```

Grab the hostname of the machine & check it against known results (in my case I just check for _trifid_). Any shell call can be used here if hostname isn't appropriate. Then, setup the required libraries, includes and compiler information specific to the identified machine. Most importantly: append `CPPFLAGS` to incorperate a machine bool set to 1 which the pre-processor macros are looking for.

_Et voilà!_ Call `make` on either machine and build without a hassle. No more merge conflicts between git branches for me. _A shoutout to [Ash](http://tuxdude.github.com/) who put me on the right path with this issue._

