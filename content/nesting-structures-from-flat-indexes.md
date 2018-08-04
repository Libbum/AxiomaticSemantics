+++
title = "Nesting Structures from Flat Indexes"
description = "I don't always use recursion; but when I do, I don't always use recursion."
date = 2018-03-24
[taxonomies]
tags = ["Rust", "Algorithms"]
[extra]
banner = "shottower"
+++

SQL databases are still one of the best ways of storing relational data, but sometimes you hit a wall transferring your representation to or from a table based layout.

Say we have a table full of `Foo`s, where some `Foo`s may have other `Foo` parents.
This can easily be represented in a table with some unique primary key `id`, a secondary key `parent`, which joins to the parent's `id`, and whatever `data` `Foo` may hold.
Retrieving this table into a **rust** data structure, we'd find ourselves with something like `Vec<Foo>`, where `Foo` is defined as

```rust
struct Foo {
    id: i32,
    parent: Option<i32>,
    data: String,
}
```

This isn't really the best way to represent these data though, what you really want is more akin to

```rust
struct Bar {
    id: i32,
    data: String,
    children: Vec<Bar>,
}
```

<!-- more -->
This is a problem I came up against when writing the comment <abbr title="Application Program Interface">API</abbr> for [Oration](https://github.com/Libbum/oration).
Each comment is inserted into the database without too much hassle.
We know the parent `id`, since the frontend forwards us that information, and the unique primary key is simply auto-incremented.
When a select statement returns all comment data for a particular thread, we get a vector of `PrintedComment`s back.

```rust
// Pull data from DB for a given `path`. `conn` here is the connection to the backend database
let comments: Vec<PrintedComment> = PrintedComment::list(conn, path)?;
```

The complete `PrintedComment` struct looks like the following at the time of writing:

```rust
#[derive(Serialize, Queryable, Debug)]
/// Subset of the comments table which is to be sent to the frontend.
struct PrintedComment {
    /// Primary key.
    id: i32,
    /// Parent comment.
    parent: Option<i32>,
    /// Actual comment.
    text: String,
    /// Commenters author if given.
    author: Option<String>,
    /// Commenters email address if given.
    email: Option<String>,
    /// Commenters website if given.
    url: Option<String>,
    /// Commenters indentifier.
    hash: String,
    /// Timestamp of creation.
    created: NaiveDateTime,
    /// Number of likes a comment has recieved.
    likes: Option<i32>,
    /// Number of dislikes a comment has recieved.
    dislikes: Option<i32>,
}
```

Since we want to show comment *threads* to the user; having entries in a flat list, sorted effectively by date isn't that helpful.
We need a `NestedComment` layout:

```rust
#[derive(Serialize, Debug)]
/// Subset of the comments table which is to be nested and sent to the frontend.
pub struct NestedComment {
    /// Primary key.
    id: i32,
    /// Actual comment.
    text: String,
    /// Commenters author if given.
    author: Option<String>,
    /// Commenters indentifier.
    hash: String,
    /// Timestamp of creation.
    created: DateTime<Utc>,
    /// Comment children.
    children: Vec<NestedComment>,
    /// Total number of votes.
    votes: i32,
}
```

I'll skip over some of the conversions here, but you can clearly see we compress the commenter's contact details into `author`, and sum `votes`.
Most importantly though, we need a way to implement the nesting.

We know that our comments will have at most one parent, and that parent will not be itself.
In that sense, the tree structure we wish to build can be considered as a special case of a directed digraph, and the method to generate a set of `NestedComment`s involves building such a graph of all `PrintedComment`s; traversing it recursively, then returning sets of children at each level.

[Bluss](https://github.com/bluss) has written an excellent graph data structure library called [petagraph](https://github.com/bluss/petgraph) from which we'll build a `petgraph::DiGraphMap`&mdash;a directed graph that allows us to control the node `id`s.
If a node has a parent, we ensure that exists in the graph and add an edge from the parent to the child.
If it doesn't have a parent, we know this is one of our top-level comments, so we stash it aside for later:

```rust
let mut graph = DiGraphMap::new();
let mut top_level_ids = Vec::new();

for comment in &comments {
    //For each comment, build a graph of parents and children
    graph.add_node(comment.id)

    //Generate edges if a relationship is found, stash as a root if not
    if let Some(parent_id) = comment.parent {
        graph.add_node(parent_id);
        graph.add_edge(parent_id, comment.id, ());
    } else {
        top_level_ids.push(comment.id);
    }
}
```

Next, we iterate over all of the top-level `id`s and collect our children:

```rust
//Run over all root comments, recursively filling their children as we go
let tree: Vec<_> = top_level_ids
    .into_iter()
    .map(|id| build_tree(&graph, id, &comments))
    .collect();
```

The `build_tree` function is the recursive core of the problem.
The implementation first (again) calls the recursive map for all comments and collects direct children at this level into a vector.
The `::new` constructor on `NestedComment` is passed this populated list of children, building the complete struct for the given top-level `id`.
If the child vector is empty, we know the current comment has no replies, and we can therefore pass an empty vector to the `NestedComment` constructor.

```rust
/// Construct a nested comment tree from the flat indexed data obtained from the database.
fn build_tree(graph: &DiGraphMap<i32, ()>, id: i32, comments: &[PrintedComment]) -> NestedComment {
    let children: Vec<NestedComment> = graph
        .neighbors(id)
        .map(|child_id| build_tree(graph, child_id, comments))
        .collect();

    //We can just unwrap here since the id value is always populated from a map over contents.
    let idx: usize = comments.iter().position(|c| c.id == id).unwrap();

    if !children.is_empty() {
        NestedComment::new(&comments[idx], children)
    } else {
        NestedComment::new(&comments[idx], Vec::new())
    }
}
```

At this point, our list is completely nested and ready to be pushed to the frontend without fear of your witless, snarky responses being incorrectly assigned to the wrong *first!* comment.

You can take a look at the complete implementation of `NestedComment`'s methods [here](https://github.com/Libbum/oration/blob/f323db9d0bea3fc3d581dd31efc2e09fdedc00ed/src/models/comments/mod.rs#L610-L724).
In the coming days I plan to write up some further caveats I uncovered when working with this data in **Elm** on the frontside of [oration](https://github.com/Libbum/oration), so please at least attempt to contain your excitement until then.
