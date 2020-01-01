+++
title = "Akasha Notifier—Part I"
description = "Yet more push notifications for your phone to suppress in the name of aggressive power saving."
date = 2020-01-01
[taxonomies]
tags = ["Elm", "Rust", "Security", "VPS"]
[extra]
banner = "phonebooth"
+++

A project that started out as simply updating a few contact forms, the code from which is now over a decade old [set](https://github.com/Libbum/VeritasWeb/blob/fc3c137e417cb55e3138ebfb4aa467ba6d965882/dist/image.php) [of](https://github.com/Libbum/VeritasWeb/blob/fc3c137e417cb55e3138ebfb4aa467ba6d965882/dist/process.php) php scripts, has turned into a monster overhaul of my server architecture & monitoring thereof.

This post will explore the ins and outs of the solution now implemented for this initial task of contacting me when someone uses a notification form on a website I administer, and soon in Parts II and III we will take a look at how this system oversees my infrastructure.

<!-- more -->

Without getting into the specifics of the old scripts, they had two major pros going for them:

1. A simple captcha system to mitigate spam
2. A php backend that could obfuscate my mailing address for the same purpose

But now, in the future we have things like [CVE-2019-11043](https://www.tenable.com/cve/CVE-2019-11043), and the general annoyance of working with php in the first place.
Oh, and push notifications, [async&ndash;await stabilised](https://blog.rust-lang.org/2019/11/07/Async-await-stable.html) and cool new frameworks to learn instead of working on the things you should be instead.
