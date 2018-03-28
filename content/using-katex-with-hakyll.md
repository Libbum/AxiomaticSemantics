+++
title = "Using KaTeX with Hakyll"
description = "Lightning fast math rendering on the off-chance I ever get around to posting some maths."
tags = ["LaTeX", "Haskell", "JavaScript"]
date = 2015-08-06
aliases = ["/posts/2015-08-06-using-katex-with-hakyll.html"]
[extra]
katex = true
banner = "blackboard"
+++

When [Khan Academy](https://www.khanacademy.org/) initially released [KaTeX](http://khan.github.io/KaTeX/) 0.1.0 last year I was overjoyed.
The performance comparison against [MathJax](https://www.mathjax.org/) was impressive and realistically the only reason __MathJax__ has ever needed competition.
For those interested in seeing the difference first hand, [IntMath](http://www.intmath.com/cg5/katex-mathjax-comparison.php) has a decent test suite.

<!-- more -->
After looking under the hood though I could see my work was going to be cut out for me if I wanted to incorporate it into this blog.
Unlike __MathJax__, which scanned the `document.body` and rendered math elements (indicated via `\[ ... \]` tags) on the fly, __KaTeX__ required the following syntax:

``` javascript
katex.render("c = \\pm\\sqrt{a^2 + b^2}", element);
```

Not really a problem in general, although it was obvious for my case I'd have to write some form of math parser for the markdown portion of [Hakyll](http://jaspervdj.be/hakyll/).
Still being quite the __Haskell__ neophyte, this became something for the too hard basket.
Maybe I also rationalised the decision not to work on a solution due to the very restricted subset of __LaTeX__ features implemented at the time.
I mean, not that I ever do much with relational algebra, but the natural join operator (aka the bowtie: \\(\bowtie\\)) wasn't introducted until v0.2.0.
How am I supposed to make a fancy outfit for my mathematical symbol cat illustrations without a bowtie?

Fast forward a year and __KaTeX__ has matured immensely, and is currently at v0.5.0.
The feature list is much more expansive, and the only gripes I really have are the missing environments like `\align` and the font modifers `\mathrm`, `\mathbf`, `\mathcal` _etc._
However, it looks like these will all be part of the next release according to the status of [this pull request](https://github.com/Khan/KaTeX/pull/132).

My personal saviour was introduced in v0.3.0 by the way of the [auto-render extension](https://github.com/Khan/KaTeX/blob/master/contrib/auto-render/README.md) which acts in a similar fashion to the __MathJax__ implementation and scans for `$$ ... $$`, `\[ ... \]` and `\( ... \)` tags.
The first two tags indicate the display size environment whereas the last tag is for inline maths.

Luckily, you can configure __Pandoc__ such that __Hakyll__ parses the single `$ ... $` tag in markdown and renders it as `\( ... \)` for use with __MathJax__.
Travis Athougies has a good writeup on how to do this on his blog [here](http://travis.athougies.net/posts/2013-08-13-using-math-on-your-hakyll-blog.html), although I overload my pandoc options a little different so that __Pygments__ can be used to do the syntax highlighting on my blog (see my [Pandoc.hs](https://github.com/Libbum/AxiomaticSemantics/blob/master/Includes/Pandoc.hs)):

``` haskell
readerOpts :: ReaderOptions
readerOpts =
    let extensions =
        S.fromList [ Ext_tex_math_dollars
                              , Ext_inline_code_attributes
                              , Ext_abbreviations
                              ]
    in def { readerSmart = True
                , readerExtensions = S.union extensions (writerExtensions def)
                }

writerOpts :: WriterOptions
writerOpts = def { writerHTMLMathMethod = MathJax ""
                                  , writerHighlight = False
                                  , writerHtml5 = True
                                  }
```

So to get __KaTex__ working from this starting point, we just need to build a maths context

``` haskell
import qualified Data.Map as M

mathCtx :: Context a
mathCtx = field "katex" $ \item -> do
    metadata <- getMetadata $ itemIdentifier item
    return $ if "katex" `M.member` metadata
                            then "<link rel=\"stylesheet\" href=\"/css/katex.min.css\">\n\
                                      \<script type=\"text/javascript\" src=\"/js/katex.min.js\"></script>\n\
                                      \<script src=\"/js/auto-render.min.js\"></script>"
                            else ""
```

and apply it to any template where the context is needed. For me, that's:

``` haskell
loadAndApplyTemplate "templates/default.html" (mathCtx `mappend` postCtx) full
--- ... ---
>>= loadAndApplyTemplate "templates/default.html" (mathCtx `mappend` indexCtx)
```

which you can checkout properly in my [site.hs](https://github.com/Libbum/AxiomaticSemantics/blob/master/site.hs).
The reason I do it this way rather than just calling the stylesheet and .js files in `default.html` is to keep the site as lean as possible.
Sure, I have some fancy things going on in the header _etc._ but I'm not pulling in `jQuery` or some other large library for no good reason, and there's no good reason to load __KaTeX__ on every page when only a few places will ever need it.

So I have a `katex` field which, if activated in the preamble of a post (for instance, see the markdown of this entry [here](https://raw.githubusercontent.com/Libbum/AxiomaticSemantics/master/posts/2015-08-06-using-katex-with-hakyll.markdown)), pumps in the return result of the `katex` field above into `default.html` (full source [here](https://github.com/Libbum/AxiomaticSemantics/blob/master/templates/default.html)) and calls the auto-renderer.

``` html
$if(katex)$ $katex$ $endif$
<!-- ... -->
$if(katex)$
<script>
  renderMathInElement(document.body);
</script>
$endif$
```

With all that in place, embedding maths into posts is essentially trivial, cross platform and most importantly seemless.
As an example, heres a short discussion about some of my recent work using just the `$ ... $` inline and `$$ ... $$` display tags in markdown.


---

Wick rotations are primarily used to find solutions to Minkowski space problems by an Euclidean space mapping.
We can also use the rotation to evolve a time-dependent Schrödinger equation and solve for time-independent solutions in three dimensions.
To do so we transfer our TDSE into an imaginary time basis $t=i\tau$:

$$i \hbar \frac{\partial}{\partial t}\Psi(\vec{r},t) = H\Psi(\vec{r},t) \Rightarrow - \hbar \frac{\partial}{\partial \tau}\Psi(\vec{r},\tau) = H\Psi(\vec{r},\tau)$$

which yields a general solution to the wavefunctions

$$\Psi(\vec{r},\tau) = \sum_{k=0}^\infty a_k\psi_k(\vec{r})e^{-E_k \tau}.$$

Using the Gram-Schmidt orthoganilsation procedure, higher order orthogonal eigenfunctions can be found by projecting a guess along the lower states.
For example

$$\lvert\tilde{\psi^\prime_1}\rangle = \lvert\psi^\prime_1\rangle-\lvert\psi_0\rangle\langle\psi_0\vert\psi^\prime_1\rangle,$$

which can even identify eigenfunctions within a degenerate subspace, as each state is _chosen_ to be orthogonal to the systems' basis.

__UPDATE:__

As of `Hakyll 4.8.0.0`, a complete metadata overhaul has occured to support YAML. This has broken the `mathCtx` function above and should be replaced by

``` haskell
mathCtx :: Context a
mathCtx = field "katex" $ \item -> do
    katex <- getMetadataField (itemIdentifier item) "katex"
    return $ case katex of
                    Just "false" -> ""
                    Just "off" -> ""
                    _ -> "<link rel=\"stylesheet\" href=\"/css/katex.min.css\">\n\
                             \<script type=\"text/javascript\" src=\"/js/katex.min.js\"></script>\n\
                             \<script src=\"/js/auto-render.min.js\"></script>"
```

Additionally, much of the gripes concerning __KaTeX__'s math coverage are null and void as the project has matured immensely since the time I initially wrote this post.
