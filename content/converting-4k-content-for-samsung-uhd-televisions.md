+++
title = "Converting 4K Content for Samsung UHD Televisions"
description = "That is, until the Samsung firmware actually supports their own containers..."
tags = ["Video", "4K"]
date = 2014-11-22
aliases = ["/posts/2014-11-22-converting-4k-content-for-samsung-uhd-televisions.html"]
[extra]
banner = "hdr"
+++

Early adoption of new technologies is usually mired by complications, but what's been shitting me lately is the trend manufacturers seem to have of pushing tech to market that doesn't even support the main draw card of the product. I purchased a Samsung UA55F9000 UHD TV in December 2013: the month they were released, solely for the 4k capability. Fast forward a year later and I'm still fighting with the upper echelons of Samsung tech support concerning the absolute necessity of being able to use my 4k TV to play 4k content.

<!-- more -->
You see, the manual states the TV will play a `.S4ud` file: essentially a `H.264` video and an `AC3` audio stream multiplexed into a `TS` container. No firmware update since the TVs manufacture has actually allowed this. A second possibility is to use QFHD&mdash;four separate HD streams that are then joined together to yield a 4K stream. After quite a conversation with Samsung tech support it was elucidated that this is actually happening in-store when you see these TVs in action with those amazing demos.

So off I went and cut up a few sample files and tested it out&mdash;no dice. Two of the four segments were playing, the others were a jaggered mess. After more back and forth with the guys in tech, turns out the demo capability had been broken somewhere in an early firmware patch that was propagated through a number of subsequent versions. Thankfully, this debacle has been fixed and I'm now happily viewing my 4K content in all its glory. Downside is it's still QFHD, not a nice single `TS` container.

There's also a number of caveats with this method, for instance the files must be named `UHD_demo_{a,b,c,d}_*.mp4{sub}`, where `a` is the main file (top left), and the `b-d` files are `sub` streams.

Long story short, I've developed a few scripts to automatically take care of all of these problems. They could use a little cleaning up, and wifi connectivity problems at my new house has seen me jump back to Windows recently&mdash;so these are batch files rather than bash scripts. Shouldn't be too hard to port them yourself though.

UHD 4K is 3840×2160 pixels, although Digital cinema 4K is 4096×2304. Before the resolution standards settled down, a plethora of content out there was letterboxed in some way, but 4096 pixels wide. Considering this, there are three scripts below for each of these three possibilities. Granted, I could set this up to find the resolution first but _brevior saltare cum deformibus mulieribus est vita_ amiright? Call these snippets `conv.bat` or something to that effect, and run `conv inputFile.mp4` (for example) at the CLI. The output will be four files titled with the convention above, where `*` will be `inputFile` (to keep things in order, these files output to a folder `qfhd` and the converted file is archived to a `converted` folder). Then, you'll need to put them on a fast USB3 stick and plug it into the TV. You'll only see the `a` file, run it and actually enjoy that massive hole you previously burnt into your wallet.

`Ffmpeg` is the only dependency you'll need. Alter the rate factor in the script (`-crf`) to your liking; but I've found 15 works just fine.

__3840×2160__
``` bat
    @echo off
    set input=%1
    set name=%input:~0,-4%
    echo Processing %input%
    echo Top left corner and sound
    ffmpeg -i %input% -vcodec libx264 -crf 15 -acodec ac3 -vf "crop=iw/2:ih/2:0:0" a.mp4
    move a.mp4 qfhd\UHD_demo_a_%name%.mp4
    echo Bottom left corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "crop=iw/2:ih/2:0:ih/2" b.mp4
    move b.mp4 qfhd\UHD_demo_b_%name%.mp4sub
    echo Top right corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "crop=iw/2:ih/2:iw/2:0" c.mp4
    move c.mp4 qfhd\UHD_demo_c_%name%.mp4sub
    echo Top right corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "crop=iw/2:ih/2:iw/2:ih/2" d.mp4
    move d.mp4 qfhd\UHD_demo_d_%name%.mp4sub
    move %input% converted\
    echo Processing of %input% Complete
    @echo on
```

__4096×2304__
``` bat
    @echo off
    set input=%1
    set name=%input:~0,-4%
    echo Processing %input%
    echo Top left corner and sound
    ffmpeg -i %input% -vcodec libx264 -crf 15 -acodec ac3 -vf "scale=3840:2160,crop=iw/2:ih/2:0:0" a.mp4
    move a.mp4 qfhd\UHD_demo_a_%name%.mp4
    echo Bottom left corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "scale=3840:2160,crop=iw/2:ih/2:0:ih/2" b.mp4
    move b.mp4 qfhd\UHD_demo_b_%name%.mp4sub
    echo Top right corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "scale=3840:2160,crop=iw/2:ih/2:iw/2:0" c.mp4
    move c.mp4 qfhd\UHD_demo_c_%name%.mp4sub
    echo Top right corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "scale=3840:2160,crop=iw/2:ih/2:iw/2:ih/2" d.mp4
    move d.mp4 qfhd\UHD_demo_d_%name%.mp4sub
    move %input% converted\
    echo Processing of %input% Complete
    @echo on
```

__4096×anything__
``` bat
    @echo off
    set input=%1
    set name=%input:~0,-4%
    echo Processing %input%
    echo Top left corner and sound
    ffmpeg -i %input% -vcodec libx264 -crf 15 -acodec ac3 -vf "scale=3840:-1,pad=3840:2160:0:(2160-ih)/2,crop=iw/2:ih/2:0:0" a.mp4
    move a.mp4 qfhd\UHD_demo_a_%name%.mp4
    echo Bottom left corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "scale=3840:-1,pad=3840:2160:0:(2160-ih)/2,crop=iw/2:ih/2:0:ih/2" b.mp4
    move b.mp4 qfhd\UHD_demo_b_%name%.mp4sub
    echo Top right corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "scale=3840:-1,pad=3840:2160:0:(2160-ih)/2,crop=iw/2:ih/2:iw/2:0" c.mp4
    move c.mp4 qfhd\UHD_demo_c_%name%.mp4sub
    echo Top right corner
    ffmpeg -i %input% -vcodec libx264 -crf 15 -an -vf "scale=3840:-1,pad=3840:2160:0:(2160-ih)/2,crop=iw/2:ih/2:iw/2:ih/2" d.mp4
    move d.mp4 qfhd\UHD_demo_d_%name%.mp4sub
    move %input% converted\
    echo Processing of %input% Complete
    @echo on
```
