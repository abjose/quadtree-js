# quadtree-js

This is a slightly optimized javascript implementation of a [quadtree](http://en.wikipedia.org/wiki/Quadtree) datastructure. It's very similar to the other JS quadtree libraries floating around, meaning it:

* **is a quadtree**
* **stores [AABBs](http://en.wikipedia.org/wiki/Bounding_box#Axis-aligned_minimum_bounding_box)**

along with a few additional features:

* **can 'coarsen'** (when you remove objects, the quadtree handles updating its structure rather than needing to be rebuilt each time)
* **can filter nodes during query** (can exclude nodes from results or even stop searching down a particular branch of the tree using filters)
* **constrains results to search region by default** (only returns objects you ask for, rather than every object in every overlapping node)
* **constant-time object-to-node lookups** (makes deletion fast, and useful if objects are moving around within the quadtree)
* **objects are kept at their minimal containing node** (large objects are typically 'broken down' to be stored in the leaves of the tree, but this can make things extremely slow - instead, objects are stored only once in the tree, at the smallest node that fully contains them)
* **expands to accommodate objects external to tree bounds**

If these don't sound like things you'll need, consider using a different library, or at least comparing insertion/deletion performance for your use case with that of other libraries (I'd love to hear what you find!).


## Demo

A JSFiddle of examples/demo.html:
http://jsfiddle.net/6dk62byy/4/

Note that, due to objects being stored in their minimal containing node, objects lying on the border of node regions will actually be stored one level higher in the tree. You can see this in the demo by placing a point on the boundary of a node - it should be highlighted whenever that node's parent is moused over.

## Usage

Make a quadtree:

    var qt = new Quadtree({x: 0,
                           y: 0,
                           w: 100,
                           h: 100,
                           max_objects: 150,   // optional
                           max_levels:  10,    // optional
                           filters:     [] }); // optional

Insert an AABB:

    qt.insert({x: 5,
               y: 5,
               w: 10,
               h: 10
               id: 'test'});

Query the quadtree:

    // query the entire quadtree
    qt.query(); 

    // query a specific region
    qt.query({x: 0,
              y: 0
              w: 10,
              h: 10});

    // query a region and filter results so only get the node with id:0
    qt.query({x: 0, y:0, w:100, y:100},
             function(id) { return id === '0'; } );

    // query a region and stop traversing the tree anywhere id:0 is encountered
    qt.query(null
             function(id) { return (id === '0') ? null : true; } );

    
Remove objects from the quadtree:

    // removes the object with id 'test'
    qt.remove_by_id('test'); 

    // remove objects overlapping a region
    qt.remove_by_region({x: 0,
                         y: 0,
                         w: 10,
                         h: 10}); 

    // remove objects using a filter
    qt.remove_by_filter(function(id) { return id > 400; });

Clear the quadtree:

    qt.clear();