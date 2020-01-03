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

This post will explore the ins and outs of the solution now implemented for this initial task of contacting me when someone uses a notification form on a website I administer, and soon&mdash;in Parts II and III&mdash;we will take a look at how this system now oversees my infrastructure.

<!-- more -->

Without getting into the specifics of the old scripts, they had two major pros going for them:

1. A simple captcha system to mitigate spam
2. A php backend that could obfuscate my mailing address for the same purpose

But now, in the future we have things like [CVE-2019-11043](https://www.tenable.com/cve/CVE-2019-11043), and the general annoyance of working with php in the first place.
Oh, and push notifications, [async&ndash;await stabilised](https://blog.rust-lang.org/2019/11/07/Async-await-stable.html) and cool new frameworks to learn and a lot of over-engineering to do instead of working on the things you should be instead.

## Replacing PHP

So literally the only thing I had running on one of my web servers using PHP was a few instances of this contact form.
Getting rid of that would require some form of new backend, and I wanted it snappy.
A few run-ins with [rocket](https://rocket.rs/)'s synchronous paradigm when spawning off requests to 3rd parties caused me no end of annoyance when actively working on [oration](https://github.com/Libbum/oration).
I'd heard that [actix-web](https://actix.rs/) had solved a bunch of its teething problems, so decided to start with it as a basis.

The last quarter of 2019 was perhaps not the best time to be working on a Rust web app&mdash;pretty much everything was in a state of flux as `Futures` & `async`/`.await` stabilised, and libraries either rushed to patch or failed to do so in a timely fashion.
Suffice to say, this codebase undertook myriad revisions to get it to where it stands now.
`Actix-web 2.0` thankfully now exists, running on standardised async-await code, although my implementation has a synchronous blocker from `redis-rs`.
A major PR has been [merged in that crate](https://github.com/mitsuhiko/redis-rs/pull/232) to bring it up-to-date, however I'd prefer to wait for an official release on that rather than relying on a `#master` dependency.

Anyway, let's just concern ourselves with the current implementation and what I learnt along the way.
My plan here was to provide a full fledged solution that takes on a bunch of edge cases.
There's always some rando on Hackernews spouting about their new 'Minimalistic', 'bare-bones', 'streamlined', 'no bullshit' implementation of a can opener or whatever.
These projects are <abbr title="Minimal Viable Product">MVP</abbr>s in the *absolute* minimal of senses, they should probably be calling them ₘVPs.
Seldom do these projects have to deal with actual infrastructure questions, so a lot of these problems are seemingly absent from help forums and such online; hopefully I can shed some light on a couple of these issues as we go along for those of you interested in how best to handle them.

## The backend

Other than Actix, we've got a few more dependencies, but not a whole bunch:

```toml
[dependencies]
log = "0.4"
simplelog = "0.7"
failure = "0.1"
failure_derive = "0.1"
actix = "0.9"
redis = "0.13"
actix-cors = "0.2.0"
actix-web = { version = "2.0", features = ["openssl"] }
actix-http = "1.0.1"
actix-rt = "1.0"
base64 = "0.10"
captcha = "*"
serde = "1.0"
serde_derive = "1.0"
uuid = { version = "0.7", features = ["serde", "v4"] }
config = "0.9"
lazy_static = "1.4"
url = "2.1"
```

Literally a few crates for log handling, error handling, serialisation & configuration.
The only 'extra' ones outside of those are `captcha`, which I use in conjunction with `uuid` and `base64`, and `redis`&mdash;which is probably well known to those of you reading this post, but the first time I've seen the need to use it.

For the moment, I haven't made this code public.
Initially due to concerns over my plans to be a bit sloppy about personal info scattering the codebase, then due to perceived abuse vectors (which I think I've managed to subsequently cover), now for no other reason than I'd have to like, you know, click a few buttons.
We'll go over some of the more interesting portions here, but if you're interested in seeing more, feel free to get in touch.

### Making things async with actix-web

Here's the `main` function of the app as it stands:

```rust
#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    //Evaluate strings to dump early if there is an issue.
    //We can't seem to invoke an error in the lazy_static context.
    let _ = SETTINGS.get::<String>("bot_token");

    simplelog::WriteLogger::init(
        simplelog::LevelFilter::Info,
        simplelog::Config::default(),
        std::fs::OpenOptions::new()
            .append(true)
            .create(true)
            .open("/var/log/akasha-notifier/notifier.log")?,
    )
    .unwrap_or_else(|err| exit_with_message("Failed to initiate logging", &err));

    let client = redis::Client::open("redis://127.0.0.1/")
        .unwrap_or_else(|err| exit_with_message("Could not find Redis", &err));
    let redis_connection = web::Data::new(KVStore {
        connection: Mutex::new(
            client
                .get_connection()
                .unwrap_or_else(|err| exit_with_message("Could not connect to Redis", &err)),
        ),
    });

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(
                Cors::new()
                    .allowed_origin("http://localhost:8000")
                    .allowed_origin("https://www.exactlyinfinite.com")
                    .allowed_origin("https://odyssey.neophilus.net")
                    .allowed_methods(vec!["GET", "POST"])
                    .finish(),
            )
            .wrap(Compress::new(ContentEncoding::Br))
            .app_data(redis_connection.clone())
            .service(web::resource("/captcha").route(web::get().to(get_captcha)))
            .service(web::resource("/contact").route(web::post().to(process_contact_request)))
    })
    .bind("127.0.0.1:7361")?
    .run()
    .await
}
```

