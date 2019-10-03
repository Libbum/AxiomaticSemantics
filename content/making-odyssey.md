+++
title = "Making Odyssey"
description = "Why have just one semi-neglected blog platform?"
date = 2019-02-18
[taxonomies]
tags = ["Elm", "Rust"]
[extra]
banner = "eysturoy"
+++

Realistically more time is sunk into the design of this blog than content for it, and so in similar fashion it's my honour to introduce you to my photoblog [Odyssey](https://odyssey.neophilus.net)&mdash;a completely over-engineered marvel that has the capacity to, but probably wont be updated any more regularly than this blog you're currently reading.

I've seen a lot of ways people choose to display photos in a gallery, and there's usually some form of trade-off every time.
Either you must conform to some thumbnail size and aspect ratio ([example](https://demo.10web.io/photo-gallery/)), or you just hope that no-one ever scrolls to the bottom of the page to see a miss-aligned ragged edge ([example](https://tympanus.net/Development/GammaGallery/)), or even no chance of previewing the images: just keep clicking and hope that it's worth it ([example](https://www.cnet.com/pictures/all-the-cool-new-gadgets-at-ces-2019/)).

The general issue here can be considered as a [partition problem](https://en.wikipedia.org/wiki/Partition_problem), which in less mathsy language asks the question: *How can we arrange a group of objects of various size into a container without overlapping or overflowing?*
The answer to this question is one which falls into the [NP-Complete](https://en.wikipedia.org/wiki/NP-completeness) category of annoying things most people don't want to deal with.

<!-- more -->

Luckily this is something I've created an [Elm](https://elm-lang.org/) package for: [elm-partition](https://package.elm-lang.org/packages/Libbum/elm-partition/latest/Partition). There are a number of algorithms which tackle this problem, of which three are in the package at the moment, and am working on an [anytime](https://github.com/Libbum/elm-partition/pull/8) implementation. Well, I was until I abandoned finishing it to work on Odyssey. I'll write up the specifics of how this is all done sometime in the future when I finalise some of the `TODOS` in the project.

## The Perfect Layout

So assuming that this is all just magic for now&mdash;we can take a list of images, grab their aspect ratios, figure out how many rows we'll need to make the display look nice based on the current viewport size, then use these two sets of info to create a partition of images that will fit snugly, row by row, right to the end.

{{ figure(src="screenodyssey.jpg", caption="Dynamic partitioning guarantees a structured layout.") }}

The algorithms in [elm-partition](https://package.elm-lang.org/packages/Libbum/elm-partition/latest/Partition) must choose speed over accuracy or *vice versa*.
After testing a number of algorithms I found that I could get away with using what's known as a **greedy** method, with is considered the least accurate practical partitioner (by that I mean your could randomly partition and it'd certainly be faster, but perhaps no where near accurate).
This is great since it only traverses the galleries' contents once before giving us a solution, thus allowing us to display the gallery super fast & giving us no detectable slowdown on low powered devices like smartphones.

Here's how we get the gallery layout (stripped down a bit, so take a look on [Github](https://github.com/Libbum/Odyssey/blob/master/src/Main.elm) if you want the unabridged version):

```elm
type Msg
    = ...
    | Partition Event (Result Browser.Dom.Error Browser.Dom.Viewport)
    | ...

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Partition event result ->
            case result of
                Ok vp ->
                    let
                        oldViewport =
                            vp.viewport

                        ratios =
                            getRatios <| Gallery.filterImages model.filter model.images

                        rowsGuess =
                            -- So we have the old veiwport, and we need to figure out if our new
                            -- viewport will require a scrollbar or not. Take a guess at the new div height
                            optimalRowCount ratios oldViewport.width model.window.height

                        newWidth =
                            case event of
                                Filter ->
                                    case ( oldViewport.height > model.window.height, rowsGuess < 4, model.resizedAfterLoad ) of
                                        ( True, True, _ ) ->
                                            oldViewport.width + model.scrollWidth

                                        ( False, False, True ) ->
                                            oldViewport.width - model.scrollWidth

                                        _ ->
                                            oldViewport.width

                                Init ->
                                    let
                                        multiplier =
                                            if rowsGuess < 4 then
                                                0

                                            else
                                                1
                                    in
                                    oldViewport.width - multiplier * model.scrollWidth

                                Resize ->
                                    oldViewport.width

                        rowsBest =
                            optimalRowCount ratios newWidth model.window.height

                        rows =
                            model.rows
                    in
                    ( { model
                        | partition = greedyK (weights ratios) rowsBest
                        , gallery = { oldViewport | width = newWidth }
                        , rows = { rows | total = rowsBest }
                      }
                      , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )
        ...

getRatios : List Image -> List Float
getRatios =
    List.map .aspectRatio


weights : List Float -> List Int
weights =
    List.map (\p -> floor (p * 100))


optimalRowCount : List Float -> Float -> Float -> Int
optimalRowCount imageRatios viewportWidth sceneHeight =
    let
        idealHeight =
            sceneHeight / 4.0

        summedWidth =
            imageRatios |> List.map (\r -> r * idealHeight) |> List.foldl (+) 0
    in
    round (summedWidth / viewportWidth)

greedyK : List number -> Int -> KPartition number
greedyK sequence k =
    if k > 0 then
        greedyRecurseK (List.sortWith flippedComparison sequence) k (List.repeat k [])

    else
        []

greedyRecurseK : List number -> Int -> KPartition number -> KPartition number
greedyRecurseK sorted k partitions =
    case sorted of
        [] ->
            partitions

        _ ->
            let
                kLargest =
                    List.take k sorted
            in
            partitions
                |> List.indexedMap (\idx lst -> ( idx, List.sum lst ))
                |> List.sortBy Tuple.second
                |> List.map Tuple.first
                |> List.map (\idx -> List.Extra.getAt idx kLargest)
                |> greedyRecurseK (List.drop k sorted) k
```

That's a lot to unpack, so let's start with the `Partition` message in `update`.
Two variables are fed in, the first: `event` tells us whether we've just loaded the page, have had a resize request or the gallery has been filtered in some way.
All of these events do something to the width or height of the solution in different ways and must be taken into account.
The second variable is `vp` or *ViewPort*, and ultimately the Elm runtime has just caught the window size (and size of the gallery `div`) for us.

To build the partition we first of all grab aspect ratios of each image that needs to be displayed (the filter is activated here so perhaps only a subset of the gallery will go to the screen).
Aspect ratios are calculated before hand (see section on the [manifester](#automating-the-build-process)), so no need to do anything crazy here.
`optimalRowCount` will tell us, based on our current set of images and screen size, how many rows we'll probably generate.
We use this twice; once to guess the value so that we can figure out if a scrollbar will be added (or removed).
This gets complex, but ultimately we find the scenes `newWidth`.
Then, with this width we calculate the row count again just in case this difference shifts our estimate.

Our ratios are weighted to compare `Int`s rather than `Float`s for speed, but also to keep the partition mathematics at bay (the partition function is only designed to work with integers).
The weighted ratios, together with our requested row count are now fed into the `greedyK` partitioner.
It starts by sorting our ratios highest to lowest, and identifies our row count as the number of partitions to create as `k`.
Building `k` sublists, the partitioner recursively takes the `k` largest elements and places them into the sublist which currently has the lowest sum (the first iteration obviously has sums of 0, so all are just filled with the initial values).

From here we know how to arrange our gallery so it's just a matter of spitting out rows of images to the screen.
This is mostly just boiler plate, so [take a look at the view functions](https://github.com/Libbum/Odyssey/blob/db704ec119fbfcab9a54b5b946fd2460af06534f/src/Main.elm#L969-L1035) if you're really interested.

## Dynamic backdrop

So you're going to want to have the ability to put your images in focus in your gallery.
With different image sizes & aspect ratios, displayed on screens with different resolutions and orientations; a backdrop to fill in the gaps when the image if fullscreen is a must.
Most solutions to this problem is just a black crop box.

To me, this looks much better:
{{ figure(src="zoomodyssey.jpg", caption="A Gaussian blurred thumbnail sized copy of the original combined with a transparent grain texture looks far better than a swath of black") }}

Each image kind of spills out of its bounds, but still remains crisp within its border.
The Gaussian blur used here could be applied through <abbr title="Cascading Style Sheets">CSS</abbr>, although that's a performance hit; instead we use the [manifester](#automating-the-build-process) to pre-blur the backgrounds.

## Follow me

The world map in the navigation is something I really love.
It lists everywhere I've been to in teal.
Hover over an image and its location will display on the menu panel, and the globe will rotate to highlight its location.
Select a filter from the list and the selection will be highlighted.
A trip will show geodesics of where I went, filtering by country highlights it:
{{ figure(src="worldodyssey.png", caption="Completely interactive world map.") }}

You're welcome to grab the globe and rotate it however you want, zoom in with the mouse wheel, etc.

For the moment, the globe is not native Elm, I'm porting out the drawing of that to [D3](https://d3js.org/).
I've started work in remedying this situation: [elm-topojson](https://github.com/Libbum/elm-topojson) is a functioning TopoJSON parser.
There's a lot of work to do to build `d3-geo` functionality into Elm, so I didn't want Odyssey to depend on this extension.
I'm collaborating with a few people in the Elm community on getting this done, but the process will probably be quite slow since we want to design the API right.

This is the oldest portion of the project, since it was salvaged from an earlier version of my gallery.
An earlier post gives you some insight on [how to construct a world.json](@/including-small-countries-in-your-world.json/index.md).

## Automating the build process

There are a heap of things to do to get this running at the backend.
The map needs the coordinates of each location, each location needs to be able to find the images that were taken there, as well as the name of the place in the local language.
Descriptions are put on some but not all images, trips need information about time and order of travel and a whole lot more.

I've distilled it all down to a convention on directory structure: `gallery/2017/01/Sweden/Stockholm` encodes date and location, and one config file: [odyssey.yaml](https://github.com/Libbum/Odyssey/blob/master/manifester/odyssey.yaml) which lists places and their local name along with trip information.
I call the tool that builds everything the **manifester**, and it's written in Rust.

### Thumbnail and Blur generation

The `image` crate is perfect for this work, and as you can see below the code to do so is quite straightforward.
Mostly we're just making sure our file structure is correct, and we generate the correct dimensions for each photo depending on aspect ratios (and an exception for panoramic images).

```rust
// Open image and grab its dimensions.
let img = image::open(&file.path())?;
let (width, height) = img.dimensions();
let ratio = width as f64 / height as f64;
let afile = file.clone();
rayon::spawn(move || {
    // Generate a thumbnail and blur if they doesn't already exist.
    let stem = afile
        .path()
        .file_stem()
        .and_then(|p| p.to_str())
        .expect("File stem unwrap issue.");
    let ext = afile
        .path()
        .extension()
        .and_then(|p| p.to_str())
        .expect("Extension unwrap issue.");
    let thumbnail = format!("{}_small.{}", stem, ext);
    let blur = format!("{}_blur.{}", stem, ext);
    let thumb_width = if ratio < 3.0 { 500 } else { 900 };
    if !afile.path().with_file_name(&thumbnail).exists()
        && !afile.path().with_file_name(&blur).exists()
    {
        let thumb = img.resize(thumb_width, 500, Lanczos3);
        thumb
            .save(afile.path().with_file_name(thumbnail))
            .expect("Failed to save thumbnail.");
        thumb
            .blur(30.0)
            .save(afile.path().with_file_name(blur))
            .expect("Failed to save blur.");
    } else if !afile.path().with_file_name(&thumbnail).exists() {
        img.resize(thumb_width, 500, Lanczos3)
            .save(afile.path().with_file_name(thumbnail))
            .expect("Failed to save thumbnail.");
    } else if !afile.path().with_file_name(&blur).exists() {
        img.resize(thumb_width, 500, Lanczos3)
            .blur(30.0)
            .save(afile.path().with_file_name(blur))
            .expect("Failed to save blur.");
    }
});
```

Since this is pretty much the only place that takes time in the run, we let a `rayon` threadpool take care of the work.

### Location Coordinates

Coordinates for locations are automatically pulled from [Nominatim](https://nominatim.openstreetmap.org/).
This has previously been a time consuming and tedious action, so it was frustraiting how simple the solution actually was.
Using `reqwest` we can just call up nominatim and parse the result like so:

```rust
#[derive(Deserialize, Debug)]
struct LatLon {
    lat: String,
    lon: String,
}

fn get_query_string(params: Vec<(&str, &str)>) -> String {
    let pairs: Vec<String> = params
        .into_iter()
        .map(|(k, v)| format!("{}={}", k, v))
        .collect();
    pairs.join("&")
}

fn search(place_name: &str) -> Result<LatLon, Error> {
    let params = vec![("format", "jsonv2"), ("q", place_name), ("limit", "1")];
    let query_string = get_query_string(params);
    let url = format!("{}/search?{}", NOMINATIM_ENDPOINT, query_string);
    let client = reqwest::Client::new();
    let mut res = client
        .get(&url)
        .header(USER_AGENT, format!("{} v{} - {}", NAME, VERSION, AUTHORS))
        .send()?;
    let mut results = res.json::<Vec<LatLon>>()?;
    results.reverse();
    let first = results.pop().ok_or_else(|| {
        failure::err_msg(format!(
            "Search for {} did not find coordinates",
            place_name
        ))
    })?;
    Ok(first)
}
```

Later on, the latitude and longitude are simply parsed to floats

```rust
let coordinates = vec![coords.lon.parse::<f32>()?, coords.lat.parse::<f32>()?];
```

### Templating

Further to these two tasks, manifester creates the `world.json` file needed to build the map, and creates a `Manifest.elm` file including all the details needed for the gallery.
Mostly this is just `serde` work, so I won't discuss it here, but [the details are on Github](https://github.com/Libbum/Odyssey/blob/master/manifester/src/main.rs).


## Security

Something I've been acutely aware of in the past is XSS attacks, and pretty much all galleries I've seen out there don't take this seriously.
So from the start I wanted this site to be locked down tight.
For this to happen this meant no inline styles, js, anything.
An A+ rating (115/100) on [Mozilla Observatory](https://observatory.mozilla.org/analyze/odyssey.neophilus.net) is something that I'm very happy with for this project.

## The future

Apart form the conversion of the globe portion from D3 to pure Elm, there's not a heap of things I have planned at the moment (apart from actually keeping it updated).
I've considered allowing video support, although I don't take too much video when travelling.
Then, in the longer term, perhaps I could wrap this up into a marketable product&mdash;perhaps removing the globe, the gallery itself is better than many out there currently.

If you have any suggestions of what could be improved or added, I'd love to hear from you!
