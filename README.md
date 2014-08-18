# quadtree-js

This is a slightly optimized javascript implementation of a [quadtree](http://en.wikipedia.org/wiki/Quadtree) datastructure. It's very similar to the other js quadtree libraries floating around, meaning it:

* is a quadtree
* stores [AABBs](http://en.wikipedia.org/wiki/Bounding_box#Axis-aligned_minimum_bounding_box)

A few small additions:

* can 'coarsen' (when you remove objects, the entire quadtree need not be rebuilt -- it automatically handles changing existing )
* filters spatial queries by default (only returns objects you ask for, rather than every object in every overlapping node)
* constant-time object-to-node lookups (makes deletion fast, and good for handling objects that move around within the quadtree)
* one object per tree (large objects are typically 'broken down' to be stored in the leaves of the tree, but this can make things extremely slow - instead, objects are stored only once in the tree, at the smallest containing node)
* expands to accomodate external objects

If these don't sound like things you'll need, consider using a different library, or at least compare insertion/deletion speeds for your typical use case ( I'd love to hear what you find!).


## Demo

A JSFiddle of examples/demo.html:
http://jsfiddle.net/6dk62byy/


## Usage

Make a quadtree:

    var qt = new Quadtree({x: 0,
    	                   y: 0,
                           w: 100,
			   h: 100,
			   max_objects: 150, // optional
			   max_levels:  10;  // optional
			   });

Insert an AABB:

    qt.insert({x: 5,
	       y: 5,
	       w: 10,
	       h: 10
	       id: 'test'});

Query the quadtree:

    qt.query(); // queries the entire quadtree

    qt.query({x: 0,
              y: 0
	      w: 10,
	      h: 10});

Remove objects from the quadtree:

    qt.remove_by_id('test'); // removes the object with id 'test'

    qt.remove_by_region({x: 0,
                         y: 0,
			 w: 10,
			 h: 10}); // remove objects overlapping a region

Clear the quadtree:

    qt.clear();