+++
title = "Accessing partially recursive data structures in Elm"
description = "A comment on commenting systems, implementation discussion for your discussions on implementations."
tags = ["Elm", "Algorithms"]
date = 2018-03-29
[extra]
banner = "forest"
+++

So you've read over the [Recursive Type Aliases](https://github.com/elm-lang/elm-compiler/blob/0.18.0/hints/recursive-alias.md) hints in the **Elm** compiler documentation and that all seems straightforward.
Mainly because it is, but unfortunately simple examples like this are seldom actually useful when you need to actually *do* something.

In my [last post](/nesting-structures-from-flat-indexes/), I talked about generating a nested structure of comments and any replies pulled from a database at the backend of [oration](https://github.com/Libbum/oration), so that this data could be exposed via an <abbr title="Application Program Interface">API</abbr> in <abbr title="JavaScript Object Notation">JSON</abbr> format.
Now, I'd like to continue the conversation at the frontend&mdash;hopefully answering the question: how do we invoke a recursive type and do some work with one?

<!-- more -->
Let's start out with a [less obvious but nicer](https://github.com/elm-lang/elm-compiler/blob/0.18.0/hints/recursive-alias.md#less-obvious-but-nicer) layout for our comments and replies:

```elm
type alias Comment =
    { text : String
    , author : Maybe String
    , hash : String
    , created : DateTime
    , id : Int
    , votes : Int
    , children : Responses
    , visible : Bool
    , editable : Bool
    , votable : Bool
    }


type Responses
    = Responses (List Comment)
```

At this point, the documentation gives you a nice looking `upvote` example function which for here would look like `{ comment | votes = 1 + comment.votes }` for any given `comment`.
Directly after this though, a small additional quip is added:

> So rather than having to unwrap a Comment to do anything to it, you only have to do some unwrapping in the cases where you are doing something recursive.

That's great and all (and perhaps someone more versed in **Elm** could set me straight here), but when in this situation would you only be applying functions like `upvote` to `Comments` and not `Responses`?
Since it's considered poor form to index into a list/array in a functional language, such unwrapping seems inevitable.

## Voting

So let's have a look at [oration](https://github.com/Libbum/oration/)'s version of `upvote` to start with.
Each comment's view has like and dislike buttons, which trigger two respective functions on a click event.

```elm
like : Int -> List Comment -> List Comment
like id comments =
    List.map (\comment -> voteComment ( id, True ) comment) comments


dislike : Int -> List Comment -> List Comment
dislike id comments =
    List.map (\comment -> voteComment ( id, False ) comment) comments
```

Notice the only difference is the value of the bool passed to `voteComment`, which as you can see, indicates a positive reaction if true.
The reason why we wrap `id` and the bool into a tuple will become apparent soon.

The layout of both functions is representative of all top level functions that work on a `List Comment`.
We map over all `Comment`s in the `List`, and invoke a helper function inside an anonymous function.
If you're not familiar with functional programming, you can conceptualise this by thinking about `for i=1:N`, where the for loop is the map, `i` is `comment` inside the anonymous function and `N` would be the length of `comments`.
The map will visit all elements and expect something in return, but this could just be the element itself without any changes.

Perhaps my thinking here is not functional enough, since as you see I still pass around an `id`.
This value is stored in the backend database and we need to connect to that at some stage, thus it doesn't represent an index in the list, so hopefully I'm not committing a functional sin with this.
If my view somehow returned the `Comment` that was just clicked on, this would dramatically reduce the complexity here, and maybe this post wouldn't need to be written.
For the moment though, let's move forward with possibly only a partial understanding of the problem space&mdash;this is how we learn.
Since the `id` could be anywhere in the data structure, we have to map across all elements (which include all recursive `Responses` lists) to identify the correct comment to alter the vote on.

```elm
voteComment : ( Int, Bool ) -> Comment -> Comment
voteComment ( id, like ) comment =
    if comment.id == id then
        let
            count =
                case like of
                    True ->
                        comment.votes + 1

                    False ->
                        comment.votes - 1
        in
        { comment
            | votes = count
            , votable = False
        }
    else
        mapChildren ( id, like ) comment voteComment
```

In the end, this is ultimately the same as the example `upvote` function, but it allows you to find the correct comment in the list to upvote.
Two simple aspects of the function we can get out of the way first are the `votable` bool, which just removes the ability for someone to spam multiple upvote requests to the backend&mdash;they should only be able to vote once.
Second, the `count` variable converts a like or dislike into an increment or decrement on the total vote count.
`votes` therefore has the ability to cross the zero threshold and become a positive number.
This is probably overkill for an internet commenting system, but it's an edge case we can support without too much hassle.

It's the call to `mapChildren` when we don't match on `id` where the magic happens though.

```elm
mapChildren : a -> Comment -> (a -> Comment -> Comment) -> Comment
mapChildren value comment operation =
    let
        children =
            case comment.children of
                Responses responses ->
                    Responses <| List.map (\response -> operation value response) responses
    in
    { comment | children = children }
```

The function takes a variable of any type, a `Comment` and a function that takes both of these.
Whilst I'm quite certain that it's possible to simplify this type signature with currying; let's just say that I've kept it explicit like this for you, the reader, to work out on your own.
Write your answer in a comment below&mdash;I'll hold of on committing the correct answer to the [oration](https://github.com/Libbum/oration) repo until such time as we identify a winner.
Most of the examples I'll go through below only need to pass an `Int` (in the form of `id`), but here we need both an `Int` and a `Bool`&mdash;hence the tuple in `voteComment`.
The `a` here is type agnostic and lets us pass anything.

Inside the function, the case statement unwraps any list of replies into the `responses` variable for the current comment.
As you can see in the initial type signature, `responses` is now a `List Comment`, which we can map over in the same manner we did with its parent.
Notice that this calls `voteComments` in our example above from this nested position (or in fact any function identified as `operation` which we'll discuss below), and will continue to recurse down each branch of this comment list, checking each one.
The result is returned and re-wrapped into the `Responses` type via the `<|` operator, which effectively means *apply the result of this function to the left*.

## Visibility

With that machinery now built, we can extend the idea to other methods.
For example, if you wish to hide a comment thread, you must at least flag the visibility of the root comment (then, you can remove it and all its children in your view method).

```elm
toggleVisible : Int -> List Comment -> List Comment
toggleVisible id comments =
    List.map (\comment -> switchVisible id comment) comments


switchVisible : Int -> Comment -> Comment
switchVisible id comment =
    if comment.id == id then
        { comment | visible = not comment.visible }
    else
        mapChildren id comment switchVisible
```

As you can see, the templating here is effectively the same&mdash;update if there's a hit on `id`, recurse through the children if not.

## Updating

Updating a comment is a little more complex, but nothing overtly obtuse.

```elm
update : Edited -> List Comment -> List Comment
update edit comments =
    List.map (\comment -> injectUpdates edit comment) comments

injectUpdates : Edited -> Comment -> Comment
injectUpdates edit comment =
    if edit.id == comment.id then
        { comment
            | text = edit.text
            , author = edit.author
            , hash = edit.hash
            , editable = True
        }
    else
        mapChildren edit comment injectUpdates
```

Here I've type aliased a subset `Comment` to sandbox what a user has access to.
This `Edited` type therefore has the required changes needed for some `id`.
When the `id` of a `comment` in the list and our edited value matches we transfer the values.
It's still possible to leverage the `mapChildren` function, since the agnostic `a` type is happy to pass an `Edited` type down the line.

## Alterations on the list

OK, so we can now alter components of each comment without too much hassle, but what about operating on the list in general?

There are number of these alterations in the [Data.Comment](https://github.com/Libbum/oration/blob/master/app/elm/Data/Comment.elm) module if you're looking for more examples, but this post is getting long as it is so we'll stick to just two&mdash;they are mostly more of the same but cater to different edge cases.

### Inserting a Comment

```elm
insertNew : Inserted -> ( String, String, DateTime, List Comment ) -> List Comment
insertNew insert current =
    let
        ( commentText, hash, now, comments ) =
            current

        newComment =
            { text = commentText
            , author = insert.author
            , hash = hash
            , created = now
            , id = insert.id
            , votes = 0
            , children = Responses []
            , visible = True
            , editable = True
            , votable = False
            }
    in
    if isNothing insert.parent then
        comments ++ List.singleton newComment
    else
        List.map (\comment -> injectNew insert newComment comment) comments


injectNew : Inserted -> Comment -> Comment -> Comment
injectNew insert newComment comment =
    let
        children =
            if comment.id == insert.parent ? -1 then
                case comment.children of
                    Responses responses ->
                        Responses <| responses ++ List.singleton newComment
            else
                case comment.children of
                    Responses responses ->
                        Responses <| List.map (\response -> injectNew insert newComment response) responses
    in
    { comment | children = children }
```

Let's unpack this one a little.
There are a few inputs which allow us to construct the `newComment`, along with some defaults including an empty `Responses` list.
The if statement in `insertNew` checks if the type aliased `Inserted` structure (which consists of an `id`, `parent` and `author`) has a parent.
In the case of a genuine new comment, we append it to the list, otherwise the standard helper function template is invoked to search for the right place to put the reply.

The `children` check can't be done via `mapChildren` since we need to do something a little more complex in this situation.
The method herein attempts to identify the parent id (the `insert.parent` value is of the `Maybe Int` type, so we need to unwrap it with a known failure of -1), and if matched we can append the new comment to the end of this `Responses` list, otherwise we must go deeper.

### Comment Deletion

[Oration](https://github.com/Libbum/oration/) has two deletion methods, since it's possible that a user (or an admin) wishes to remove an unwanted comment but keep the corresponding replies.
In this instance we effectively cripple the comment&mdash;removing all content and author details concerning it, but keep its `id` and timestamp information so that replies can be rendered in the correct manner.

Alternatively, the is no need to store anything about a deleted comment with no children, so we purge these.

```elm
delete : Int -> List Comment -> List Comment
delete id comments =
    List.map (\comment -> filterComment id comment) comments
        |> values

filterComment : Int -> Comment -> Maybe Comment
filterComment id comment =
    if comment.id == id then
        let
            --Pure deletes only happen on comments with no children, so only filter if that's the case
            noChildren =
                case comment.children of
                    Responses responses ->
                        List.isEmpty responses
        in
        if noChildren then
            Nothing
        else
            --We must display a masked delete
            let
                children =
                    case comment.children of
                        Responses responses ->
                            Responses <| values <| List.map (\response -> filterComment id response) responses
            in
            Just
                { comment
                    | children = children
                    , author = Nothing
                    , hash = ""
                    , text = ""
                    , votes = 0
                    , votable = False
                }
    else
        let
            children =
                case comment.children of
                    Responses responses ->
                        Responses <| values <| List.map (\response -> filterComment id response) responses
        in
        Just { comment | children = children }
```

These two possibilities force us to alter our template a bit.
On one hand, we may return from our recursion with a complete list with an altered comment, on the other we may have removed a comment entirely.
Thus, it's necessary to return a `Maybe Comment` from our helper function, then filter out any empty elements using `|> values` in the outer function `delete`.

Once we're in the helper function, we can asses each `comment`'s properties.
Initially, there's a check for an empty children list, which is used to completely delete the comment.
Otherwise, the response is a crippled comment with no data other than its complete child list.
The `children` methods unwrap `Responses` in a similar to that of `mapChildren`, although the `Maybe` values must be handled explicitly.


## Counting Comments

There's something more simple than all of this that is paramount, and that's counting how many elements you have in this nested list of yours.

No problem right?
```elm
count : List Comment -> Int
count =
    foldl (\_ acc -> acc + 1) 0
```

But this is only going to count your original, root comments and ignore all replies.
We need to overload the `foldl` function for our type.

```elm
foldl : (Comment -> b -> b) -> b -> List Comment -> b
foldl f =
    List.foldl
        (\c acc ->
            case c.children of
                Responses responses ->
                    foldl f (f c acc) responses
        )
```

Here, we accumulate all the way down each comment branch, and once that's done use the list left fold method to sum the result, which in turn is passed up the chain.

---

For an imperative programmer, functional methods can sometimes seem confusing.
It takes time for them to 'click', but once that happens there is a certain elegance to writing code in this way.
No doubt, a true functional aficionado would scoff at most of this post, so please, if you are such a person&mdash;let me know what I can do to improve this.
For the rest of you, I hope that this gives you some more in depth examples to help you with your own projects.

**Update 2018-04-05:** Concerning the closing remarks here, writing this post actually made me 'click' even more, allowing me to cut around 30% of the logic in the [Data.Comment](https://github.com/Libbum/oration/blob/master/app/elm/Data/Comment.elm) module and simplify this post down in its complexity a good deal.
Feel free to take a look at the history of the module and this post on Github to see the changes.
