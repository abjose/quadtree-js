
/* TESTS TODO/NOTES
- add 'stress tests' for adding lots of nodes (ideally compare to other
  quadtree libs before DELETING MERCILESSLY)
- make sure proper number of subtrees after inserting and removing lots of nodes
- WEIRD BEHAVIOR for very large enlarges
- verify doesn't exceed max depth or max objects under normal insertion
- test get_accepting_child
- test get_ids
*/

/* test overlaps */
QUnit.test( "overlaps tests", function( assert ) {
  var r1 = {x:0, y:0, w:100, h:100};
  var r2 = {x:10, y:10, w:1, h:1};
  var r3 = {x:20, y:-1000, w:1, h:2000};

  // self-overlaps
  assert.ok( overlaps(r1, r1) );
  assert.ok( overlaps(r2, r2) );
  assert.ok( overlaps(r3, r3) );

  // point-overlaps
  assert.ok( overlaps(r1, r2) );
  assert.ok( overlaps(r2, r1) );

  // weird skinny overlaps
  assert.ok( overlaps(r1, r3) );
  assert.ok( overlaps(r3, r1) );

  // non-overlaps
  assert.ok( !overlaps(r2, r3) );
  assert.ok( !overlaps(r3, r2) );

  // also test quadtree shape - make sure mutually exclusive!
  var w = 100, h=100;
  var tl = {x:0,   y:0,   w:w/2, h:h/2};
  var tr = {x:w/2, y:0,   w:w/2, h:h/2};
  var ll = {x:0,   y:w/2, w:w/2, h:h/2};
  var lr = {x:w/2, y:w/2, w:w/2, h:h/2};
  assert.ok( !overlaps(tl, tr) );
  assert.ok( !overlaps(tl, ll) );
  assert.ok( !overlaps(tl, lr) );
  assert.ok( !overlaps(tr, ll) );
  assert.ok( !overlaps(tr, lr) );
  assert.ok( !overlaps(ll, lr) );
});

/* test contains */
QUnit.test( "contains tests", function( assert ) {
  var r1 = {x:0, y:0, w:100, h:100};
  var r2 = {x:10, y:10, w:1, h:1};
  var r3 = {x:20, y:-1000, w:1, h:2000};

  // self-contains
  assert.ok( contains(r1, r1) );
  assert.ok( contains(r2, r2) );
  assert.ok( contains(r3, r3) );

  // point-contains
  assert.ok( contains(r1, r2) );
  assert.ok( !contains(r2, r1) );

  // weird skinny contains
  assert.ok( !contains(r1, r3) );
  assert.ok( !contains(r3, r1) );

  // non-contains
  assert.ok( !contains(r2, r3) );
  assert.ok( !contains(r3, r2) );
});

/* test filter_region */
QUnit.test( "filter_region tests", function( assert ) {
  var r1 = {x:0, y:0, w:100, h:100, max_objects:50};
  var r2 = {x:10, y:10, w:1, h:1};
  var r3 = {x:10, y:10, w:1, h:1};
  var r4 = {x:10, y:10, w:1, h:1};
  var r5 = {x:20, y:-1000, w:1, h:2000};
  var r6 = {x:500, y:500, w:1, h:1};
  var obj_ids = {1:r1, 2:r2, 3:r3, 4:r4, 5:r5, 6:r6};
  var ids = ['1', '2', '3', '4', '5', '6'];

  var filter = get_region_filter(r1, obj_ids);
  assert.deepEqual( ids.filter(filter),
		    ['1', '2', '3', '4', '5'] );

  filter = get_region_filter(r2, obj_ids);
  assert.deepEqual( ids.filter(filter),
		    ['1', '2', '3', '4'] );
  
  filter = get_region_filter(r6, obj_ids);
  assert.deepEqual( ids.filter(filter),
		    ['6'] );
});


/* test filter_region */
QUnit.test( "filter_region adjacency tests", function( assert ) {
  var r = {x:10, y:10, w:1, h:1};
  // edges
  var ra = {x:10, y:9,  w:1, h:1};
  var rb = {x:10, y:11, w:1, h:1};
  var rl = {x:9,  y:10, w:1, h:1};
  var rr = {x:11, y:10, w:1, h:1};
  // diagonals
  var rtl = {x:9,  y:9,  w:1, h:1};
  var rtr = {x:11, y:9,  w:1, h:1};
  var rbl = {x:9,  y:11, w:1, h:1};
  var rbr = {x:11, y:11, w:1, h:1};

  var obj_ids = {1:r,
		 2:ra, 3:rb, 4:rl, 5:rr,
		 6:rtl, 7:rtr, 8:rbl, 8:rbr};
  var ids = ['1', '2', '3', '4', '5', '6', '7', '8'];

  var filter = get_region_filter(r, obj_ids);
  assert.deepEqual( ids.filter(filter),
		    ['1'] );
});

/* test get_accepting_child */
QUnit.test( "get_accepting_child tests", function( assert ) {
  var r  = {x:0, y:0, w:10, h:10};
  // non-containing
  var o1 = {x:-1, y:1,  w:1, h:1};
  assert.equal( get_accepting_child(r, o1), -1 );
  
  // containing for each quadrant
  var o2 = {x:1, y:1, w:1, h:1};
  var o3 = {x:6, y:1, w:1, h:1};
  var o4 = {x:1, y:6, w:1, h:1};
  var o5 = {x:6, y:6, w:1, h:1};
  assert.equal( get_accepting_child(r, o2), 0 );
  assert.equal( get_accepting_child(r, o3), 1 );
  assert.equal( get_accepting_child(r, o4), 2 );
  assert.equal( get_accepting_child(r, o5), 3 );
  
  // overlapping multiple quadrants / various other things
  var o6 = {x:-1, y:-1, w:4, h:4};
  var o7 = {x:-1, y:-1, w:20, h:20};
  var o8 = {x:-10, y:-10, w:1, h:1};
  var o9 = {x:3, y:3, w:3, h:3};
  var o10 = {x:3, y:3, w:3, h:1};
  var o11 = {x:3, y:3, w:1, h:3};
  var o12 = {x:6, y:3, w:1, h:3};
  var o13 = {x:3, y:6, w:3, h:1};
  assert.equal( get_accepting_child(r, o6), -1 );
  assert.equal( get_accepting_child(r, o7), -1 );
  assert.equal( get_accepting_child(r, o8), -1 );
  assert.equal( get_accepting_child(r, o9), -1 );
  assert.equal( get_accepting_child(r, o10), -1 );
  assert.equal( get_accepting_child(r, o11), -1 );
  assert.equal( get_accepting_child(r, o12), -1 );
  assert.equal( get_accepting_child(r, o13), -1 );
  
});

/* test get_ids */
QUnit.test( "get_ids tests", function( assert ) {
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:50});
  var r1 = {id:1, x:0,  y:0,  w:1, h:1};
  var r2 = {id:2, x:50, y:0,  w:1, h:1};
  var r3 = {id:3, x:0,  y:50, w:1, h:1};
  var r4 = {id:4, x:50, y:50, w:1, h:1};
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);

  assert.deepEqual( qt.root.get_ids(),
		    ['1', '2', '3', '4'] );
});

/* test refine */
QUnit.test( "refine tests", function( assert ) {
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:50});
  var r1 = {id:1, x:0,  y:0,  w:1, h:1};
  var r2 = {id:2, x:50, y:0,  w:1, h:1};
  var r3 = {id:3, x:0,  y:50, w:1, h:1};
  var r4 = {id:4, x:50, y:50, w:1, h:1};
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);
  
  // make sure root has no children
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the objects are in the right places
  assert.deepEqual( qt.query(),
		    ['1', '2', '3', '4'] );

  qt.root.refine();

  // make sure root has four children
  assert.deepEqual( qt.root.children.length, 4 );
  // make sure the objects are in the right places
  assert.deepEqual( qt.root.children[0].query({x:0, y:0, w:100, h:100}),
		    ['1'] );
  assert.deepEqual( qt.root.children[1].query({x:0, y:0, w:100, h:100}),
		    ['2'] );
  assert.deepEqual( qt.root.children[2].query({x:0, y:0, w:100, h:100}),
		    ['3'] );
  assert.deepEqual( qt.root.children[3].query({x:0, y:0, w:100, h:100}),
		    ['4'] );
});

/* test coarsen */
QUnit.test( "coarsen tests", function( assert ) {
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:50});
  var r1 = {id:1, x:0,  y:0,  w:1, h:1};
  var r2 = {id:2, x:50, y:0,  w:1, h:1};
  var r3 = {id:3, x:0,  y:50, w:1, h:1};
  var r4 = {id:4, x:50, y:50, w:1, h:1};
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);

  // force a refine
  qt.root.refine();

  // force a coarsen
  qt.root.coarsen();

  // make sure root has no children
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the objects are in the right places
  assert.deepEqual( qt.query({x:0, y:0, w:100, h:100}),
		    ['1', '2', '3', '4'] );
});

/* test expand */
QUnit.test( "expand tests", function( assert ) {
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:50});
  var r1 = {id:1, x:0,  y:0,  w:1, h:1};
  var r2 = {id:2, x:50, y:0,  w:1, h:1};
  var r3 = {id:3, x:0,  y:50, w:1, h:1};
  var r4 = {id:4, x:50, y:50, w:1, h:1};
  // requires just one expansion
  var r5 = {id:5, x:150, y:150, w:1, h:1};
  // require many expansions
  var r6 = {id:6, x:5000,   y:5000,   w:1, h:1};
  var r7 = {id:7, x:500000, y:500000, w:1, h:1};
  // and in the other directions...
  var r8  = {id:8,  x:-50000000,     y: 50000000,     w:1, h:1};
  var r9  = {id:9,  x: 5000000000,   y:-5000000000,   w:1, h:1};
  var r10 = {id:10, x:-500000000000, y:-500000000000, w:1, h:1};
  // its presence surrounds us
  // TRY SWITCHING BETWEEN THESE TWO - WEIRD BEHAVIOR!
  //var r11 = {id:11, x:-2e60, y:-2e60, w:4e60, h:4e60};
  //var r11 = {id:11, x:-2e60, y:-2e60, w:4e61, h:4e61};
  var r11 = {id:11, x:-2e10, y:-2e10, w:4e11, h:4e11};

  // insert boring objects
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);

  // insert smaller enlarge
  qt.insert(r5);
  // make sure root has no children i.e. coarsen 'bubbled up' properly
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the new object was inserted
  assert.deepEqual( qt.query(),
		    ['1', '2', '3', '4', '5'] );

  qt.insert(r6);
  // make sure root has no children i.e. coarsen 'bubbled up' properly
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the new object was inserted
  assert.deepEqual( qt.query(),
		    ['1', '2', '3', '4', '5', '6'] );

  qt.insert(r7);
  // make sure root has no children i.e. coarsen 'bubbled up' properly
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the new object was inserted
  assert.deepEqual( qt.query(),
		    ['1', '2', '3', '4', '5', '6', '7'] );

  qt.insert(r8);
  // make sure root has no children i.e. coarsen 'bubbled up' properly
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the new object was inserted
  assert.deepEqual( qt.query(),
		    ['1', '2', '3', '4', '5', '6', '7', '8'] );

  qt.insert(r9);
  // make sure root has no children i.e. coarsen 'bubbled up' properly
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the new object was inserted
  assert.deepEqual( qt.query(),
		    ['1', '2', '3', '4', '5', '6', '7', '8', '9'] );

  qt.insert(r10);
  // make sure root has no children i.e. coarsen 'bubbled up' properly
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the new object was inserted
  assert.deepEqual( qt.query(),
		    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] );

  qt.insert(r11);
  // make sure root has no children i.e. coarsen 'bubbled up' properly
  assert.deepEqual( qt.root.children.length, 0 );
  // make sure the new object was inserted
  assert.deepEqual( qt.query(),
		    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] );
});

/* test insert */
QUnit.test( "insert tests", function( assert ) {
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:50});
  var r1 = {id:1, x:0, y:0, w:100, h:100};
  var r2 = {id:2, x:10, y:10, w:1, h:1};
  var r3 = {id:3, x:10, y:10, w:1, h:1};
  var r4 = {id:4, x:10, y:10, w:1, h:1};
  var r5 = {id:5, x:20, y:-1000, w:1, h:2000};
  var r6 = {id:6, x:500, y:500, w:1, h:1};

  
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);
  qt.insert(r5);
  qt.insert(r6);

  assert.deepEqual( qt.query({x:-1000, y:-1000, w:2000, h:2000}),
		    ['1', '2', '3', '4', '6', '5']);
});

// test remove_by_region
QUnit.test( "remove_by_region tests", function( assert ) {
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:50});
  var r1 = {id:1, x:0, y:0, w:100, h:100};
  var r2 = {id:2, x:10, y:10, w:1, h:1};
  var r3 = {id:3, x:10, y:10, w:1, h:1};
  var r4 = {id:4, x:10, y:10, w:1, h:1};
  var r5 = {id:5, x:20, y:-1000, w:1, h:2000};
  var r6 = {id:6, x:-500, y:-500, w:1000, h:1000};
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);
  qt.insert(r5);
  qt.insert(r6);

  qt.remove_by_region({x:19, y:-1000, w:2, h:1});
  assert.deepEqual( qt.query(), ['1', '2', '3', '4', '6'] );

  qt.remove_by_region({x:-500, y:-500, w:2, h:1});
  assert.deepEqual( qt.query(), ['1', '2', '3', '4'] );
});

// test remove_by_id
QUnit.test( "remove_by_id tests", function( assert ) {
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:50});
  var r1 = {id:1, x:0, y:0, w:100, h:100};
  var r2 = {id:2, x:10, y:10, w:1, h:1};
  var r3 = {id:3, x:10, y:10, w:1, h:1};
  var r4 = {id:4, x:10, y:10, w:1, h:1};
  var r5 = {id:5, x:20, y:-1000, w:1, h:2000};
  var r6 = {id:6, x:-500, y:-500, w:1000, h:1000};
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);
  qt.insert(r5);
  qt.insert(r6);

  qt.remove_by_id(r6.id);
  assert.deepEqual( qt.query(), ['1', '2', '3', '4', '5']);
  
  qt.remove_by_id(r2.id);
  assert.deepEqual( qt.query(), ['1', '3', '4', '5']);
});

// test clear
QUnit.test( "clear tests", function( assert ) {
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:50});
  var r1 = {id:1, x:0, y:0, w:100, h:100};
  var r2 = {id:2, x:10, y:10, w:1, h:1};
  var r3 = {id:3, x:10, y:10, w:1, h:1};
  var r4 = {id:4, x:10, y:10, w:1, h:1};
  var r5 = {id:5, x:20, y:-1000, w:1, h:2000};
  var r6 = {id:6, x:-500, y:-500, w:1000, h:1000};
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);
  qt.insert(r5);
  qt.insert(r6);

  qt.clear();
  assert.deepEqual( qt.query(), []);
});


// stress tests
QUnit.test( "stress tests", function( assert ) {
  var x=-2000, y=-2000, w=4000, h=4000;
  var qt = new Quadtree({x:0, y:0, w:1, h:1, max_objects:150, max_level:10});
  var i=0, matches=[];

  for (; i < 1000; i++) {
    matches.push(String(i));
    var region = {x: Math.random()*w + x, y: Math.random()*h + y,
		  w: Math.random()*1000, h: Math.random()*1000,
		  //w: 10, h: 10,
		  id:i};
    qt.insert(region);
    qt.query(region);
  }
  assert.deepEqual( qt.query().sort(), matches.sort());
  
  qt.clear();
  assert.deepEqual( qt.query(), []);
});


// query after refine tests
QUnit.test( "query after refine test", function( assert ) {
  // set max_objects very low, will refine with 1 object in each region
  var qt = new Quadtree({x:0, y:0, w:100, h:100, max_objects:3});

  // make rects to go in each region
  var r1 = {id:0, x:10, y:10, w:1, h:1};
  var r2 = {id:1, x:60, y:10, w:1, h:1};
  var r3 = {id:2, x:10, y:60, w:1, h:1};
  var r4 = {id:3, x:60, y:60, w:1, h:1};
  qt.insert(r1);
  qt.insert(r2);
  qt.insert(r3);
  qt.insert(r4);

  // query top-left
  assert.deepEqual( qt.query({x:10, y:10, w:1, h:1}),
		    ['0'] );
  
});
