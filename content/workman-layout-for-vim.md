+++
title = "Workman layout for Vim"
description = "For those of us who REALLY need to type using three layouts"
tags = ["Vim", "Workman"]
date = 2013-08-13
aliases = ["/posts/2013-08-13-workman-layout-for-vim.html"]
+++

I've recently switched keyboard layouts from Dvorak to [Workman](http://www.workmanlayout.com/blog/). Dvorak has been good to me over the past 5 years or so, but the philosophy behind it wasn't actualised in it's final design. Workman has been optimised for English and minimises finger strain *etc etc*. There's no point rabbiting on about it as all of my praises or critiques are already well fleshed out on the Workman website.

<!-- more -->

It's been two weeks or so since the switch and I'm at the proficiency stage where I'm not yelling at the awkwardness of my inability to find a letter, but if the switch from Qwerty to Dvorak is any indication it'll be a couple of months until I'm completely up to speed.

I had a fantastic Vim map for Dvorak suggested by [Adam Davis](http://stackoverflow.com/questions/165231/vim-dvorak-keybindings-rebindings), which kept the Qwerty _h,j,k,l_ navigation keys in the same place; remapping sane Dvorak keys with minimal disruption. So obviously something similar for Workman that didn't disrupt Vim flow is needed.

Taking the laziest approach first; google tells me there are only two current suggestions. First, Matt Weolk has taken the complete remap Qwerty:Workman approach, which is outlined in this [gist](https://gist.github.com/MattWoelk/887861) and takes the idea from _colqer_; a Colemak solution to the same issue. I really don't like the blind approach this method uses as I remember Vim keybindings more on their associations (y = yank), than muscle memory of their original Qwerty locations. The second solution is a simple _j &#8596; t_ switch discussed in [this](http://www.workmanlayout.com/forum/viewtopic.php?id=6) thread. Closer to what I'm after, and I used it for a while; but ultimately the navigation keys being separated and not entirely on the home row doesn't sit with me.

So, here's my attempt at a decent Workman remapping for Vim:

``` vim
    nnoremap l o
    nnoremap o l
    nnoremap L O
    nnoremap O L
    nnoremap j n
    nnoremap n j
    nnoremap J N
    nnoremap N J
    nnoremap gn gj
    nnoremap gj gn
    nnoremap k e
    nnoremap e k
    nnoremap K E
    nnoremap E <nop>
    nnoremap gk ge
    nnoremap ge gk
    nnoremap h y
    onoremap h y
    nnoremap y h
    nnoremap H Y
    nnoremap Y H
```

_h,j,k,l_ are replaced by the Workman _y,n,e,o_ home keys, with a few new associations:

* (__Y__)ank -> (__H__)aul
* Search (__N__)ext -> (__J__)ump
* (__E__)nd word -> brea(__K__) of word [yeah, that one's a push...]
* (__O__)pen new line -> (__L__)ine

Considering I now use three different layouts depending on where I am, I've had to set up a layout remap function in my .vimrc. Here it is in it's present state at the time of writing; check my [dotfiles](https://github.com/Libbum/dotfiles) repository for updates though.

``` vim
    " Keyboard  **************************
    function Keyboard(type)
       if a:type == "dvorak"
           call UnmapWorkman()
           nnoremap d h
           nnoremap h j
           nnoremap t k
           nnoremap n l
           nnoremap s :
           nnoremap S :
           nnoremap j d
           onoremap j d
           nnoremap l n
           nnoremap L N

           nnoremap - $
           nnoremap _ ^
           nnoremap N <C-w><C-w>
           nnoremap H 8<Down>
           nnoremap T 8<Up>
           nnoremap D <C-w><C-r>
       elseif a:type == "workman"
           call UnmapDvorak()
           "(O)pen line -> (L)ine
           nnoremap l o
           nnoremap o l
           nnoremap L O
           nnoremap O L
           "Search (N)ext -> (J)ump
           nnoremap j n
           nnoremap n j
           nnoremap J N
           nnoremap N J
           nnoremap gn gj
           nnoremap gj gn
           "(E)nd of word -> brea(K) of word
           nnoremap k e
           nnoremap e k
           nnoremap K E
           nnoremap E <nop>
           nnoremap gk ge
           nnoremap ge gk
           "(Y)ank -> (H)aul
           nnoremap h y
           onoremap h y
           nnoremap y h
           nnoremap H Y
           nnoremap Y H
       else " qwerty
           call UnmapDvorak()
           call UnmapWorkman()
       endif
    endfunction

    function UnmapDvorak()
        "Unmaps Dvorak keys
        silent! nunmap d
        silent! nunmap h
        silent! nunmap t
        silent! nunmap n
        silent! nunmap s
        silent! nunmap S
        silent! nunmap j
        silent! ounmap j
        silent! nunmap l
        silent! nunmap L

        silent! nunmap -
        silent! nunmap _
        silent! nunmap N
        silent! nunmap H
        silent! nunmap T
        silent! nunmap D
    endfunction

    function UnmapWorkman()
        "Unmaps Workman keys
        silent! nunmap h
        silent! ounmap h
        silent! nunmap j
        silent! nunmap k
        silent! nunmap l
        silent! nunmap y
        silent! nunmap n
        silent! nunmap e
        silent! nunmap o
        silent! nunmap H
        silent! nunmap J
        silent! nunmap K
        silent! nunmap L
        silent! nunmap Y
        silent! nunmap N
        silent! nunmap E
        silent! nunmap O
    endfunction

    function LoadKeyboard()
       let keys = $keyboard
       if (keys == "workman")
           call Keyboard("workman")
       else
           call Keyboard("dvorak")
       endif
    endfunction

    autocmd VimEnter * call LoadKeyboard()

    :noremap <Leader>q :call Keyboard("qwerty")<CR>:echom "Qwerty Keyboard Layout"<CR>
    :noremap <Leader>d :call Keyboard("dvorak")<CR>:echom "Dvorak Keyboard Layout"<CR>
    :noremap <Leader>w :call Keyboard("workman")<CR>:echom "Workman Keyboard Layout"<CR>
```
