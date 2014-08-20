"use strict";

/*
- add stuff to help with updating objects - can just pass object (or ID), 
  will look up relevant node, figure out if need to change, then...just
  delete and reinsert if so?
- originally going to have hash of surface tags at each node - still do?
- check to see if 'coarsen' leads to memory leaks
- replace max_objects with refine_thresh and coarsen_thresh
- currently can violate max_depth via expand - worth fixing?
- consider adding coarsen-topdown back in
- allow quadtree to shrink if don't need to be as large as it is? i.e. have a 
  spatial "contract" in addition to "expand"
- should allow functions to take lists of things and/or multiple args
- clean up node addition/deletion in general - lots of repetition right now
  also split out quadtree and QNode and 'helper' code? maybe more annoying...
- fully taken advantage of objects being in graph only once?
- sure obj_to_node being used correctly?
- overlaps still very slow
- need to worry about overlaps testing and non-integer region coords?
- weakness of store-in-leaves - stuff on boundaries gets 'picked up' in queries
  any way to ignore? I guess won't be a big problem because you filter them
  out...
- just do filter by default???
- maybe to solve annoying default-filter problem - just allow passing
  filters to quadtree when initializing, and by default include a region
  filter unless user requests not to!!!
- TODO: allow to terminate if filter says so...
*/

function Quadtree(args) {
  // required: x, y, w, h
  // optional: max_objects, max_level
  this.max_objects = args.max_objects || 5; //100;
  this.max_level   = args.max_level   || 10;

  // id-to-object mapping - necessary?
  this.obj_ids     = {};
  // id-to-node mapping (using node ids) - necessary?
  this.node_ids    = {};
  // object id-to-node_id mapping - for each id, track referencing nodes
  this.obj_to_node = {};

  // root of quadtree
  this.root = new QNode({x:args.x, y:args.y, w:args.w, h:args.h,
			 level:0, parent:null, quadtree:this});
}

// attempt to insert passed object (with x,y,w,h,id properties)
Quadtree.prototype.insert = function(obj) {
  // verify has stuff
  if (!('x' in obj && 'x' in obj && 'w' in obj && 'h' in obj && 'id' in obj)) {
    throw "The passed object lacks one or more of: x,y,w,h,id.";
  }
  // first need to add to id-to-object map
  this.obj_ids[obj.id] = obj;
  // then insert into the root - will automatically update obj_to_node
  this.root.insert(obj.id);
};

// return a list of objects located in the given region
Quadtree.prototype.query = function(region, filter) {
  // if no region provided, query entire quadtree
  region = region || {x:this.root.x, y:this.root.y,
		      w:this.root.w, h:this.root.h};
  filter = typeof filter !== 'undefined' ? filter : function() {return true;};
  
  // by default, add filter by region
  var region_filter = get_region_filter(region, this.obj_ids);
  var filter2 = function(id) { return filter(id) && region_filter(id); };
  
  // for mouse clicks...need to scale! 1x1 will be huge zoomed in
  //region.w = region.w || 1; region.h = region.h || 1;
  return this.root.query(region, filter2);
}

// remove all references to the object with the given id
Quadtree.prototype.remove_by_id = function(id) {
  // grab affected node
  var node_id = this.obj_to_node[id];
  var node    = this.node_ids[node_id];

  // tell it to remove the object and try to coarsen
  // TODO: add object removal to node...
  //delete node.ids[id];
  node.remove_id(id);
  if (node.parent !== null) node.parent.coarsen();
  
  // then remove the object from obj_ids
  delete this.obj_ids[id];
};

// remove all elements in a given region
Quadtree.prototype.remove_by_region = function(region) {//, filter) {
  // query root to figure out what ids are in the passed region
  var filter = get_region_filter(this.root, this.obj_ids);
  var ids = this.query(region, filter);
  // kill them all
  ids.map( function(id) { this.remove_by_id(id); }, this );  
};

// delete all objects from the quadtree (leaving dimensions, etc. the same)
Quadtree.prototype.clear = function() {
  // TODO: could remove_by_region...good test to see how well that works.
  this.root = new QNode({x:this.root.x, y:this.root.y,
			 w:this.root.w, h:this.root.h,
			 level:0, parent:null, quadtree:this});
  this.root.ids.refineable   = {};
  this.root.ids.unrefineable = {};
  this.obj_ids     = {};
  this.obj_to_node = {};
};

// a node in the quadtree
function QNode(args) {
  // required: x, y, w, h, level, parent, quadtree,
  this.x = args.x; this.y = args.y;
  this.w = args.w; this.h = args.h;
  this.quadtree = args.quadtree;
  this.id = UUID(); this.quadtree.node_ids[this.id] = this;
  
  // keep track of tree-y information
  this.level    = args.level || 0;
  this.parent   = args.parent;
  this.children = [];

  // keep track of ids of objects belonging to this node
  this.ids = {};
  this.ids.refineable = {};   // ids that could be sent to a child
  this.ids.unrefineable = {}; // ids that must stay at this level
}

// attempt to insert object with given id into quadtree
QNode.prototype.insert = function(id) {
  var obj = this.quadtree.obj_ids[id],
      c   = this.get_accepting_child(obj);
  
  // check if need to 'expand' to accomodate external region
  if (this.level === 0 && !this.contains(obj)) {
    this.expand(id);
  }
  
  // see if this node has children
  else if (this.children.length !== 0) {
    // if one wants it, pass it on
    if (c !== -1) this.children[c].insert(id);
    // otherwise unrefineable
    else this.add_unrefineable([id]);
  }

  // if no children, store in self
  else {
    // store appropriately based on refine-ability
    // TODO: MOVE THIS into own function for adding ids
    // which appropriately passes on to children or stores in refineable or not
    if (c !== -1) this.add_refineable([id]);
    else this.add_unrefineable([id]);

    // see if we should refine - only check refineable
    if (Object.keys(this.ids.refineable).length > this.quadtree.max_objects)
      this.refine();
  }
};

QNode.prototype.refine = function() {
  // create children
  var c = get_child_regions(this);
  this.children[0] = new QNode({x:c[1].x, y:c[1].y, w:c[1].w, h:c[1].h,
				level:this.level+1, parent:this,
				quadtree:this.quadtree}); 
  this.children[1] = new QNode({x:c[2].x, y:c[2].y, w:c[2].w, h:c[2].h,
				level:this.level+1, parent:this,
				quadtree:this.quadtree});
  this.children[2] = new QNode({x:c[3].x, y:c[3].y, w:c[3].w, h:c[3].h,
				level:this.level+1, parent:this,
				quadtree:this.quadtree});
  this.children[3] = new QNode({x:c[4].x, y:c[4].y, w:c[4].w, h:c[4].h,
				level:this.level+1, parent:this,
				quadtree:this.quadtree});
  
  // now that node has children, give them refineable objects
  Object.keys(this.ids.refineable).map( function(id) {
    this.insert(id); }, this);

  // clear own ids
  this.clear_refineable();
};

// merge children into self (if necessary)
QNode.prototype.coarsen = function() {
  // don't need to coarsen if no children
  if (this.children.length === 0) return;
  
  // grab ids contained by children
  var ids = [].concat.apply([], this.children.map(
    function(c) { return c.query(); }
  ));
  
  // do we need to coarsen?
  if (ids.length <= this.quadtree.max_objects) {
    // subsume children
    this.clear_children();
    this.add_refineable(ids);
    // tell parent that it should consider coarsening
    if (this.parent !== null) this.parent.coarsen();
  }
};

// expand to accomodate object external to current quadtree
QNode.prototype.expand = function(id) {
  // figure out what quadrant to expand towards
  var obj = this.quadtree.obj_ids[id];
  var self_center = {x: this.x+this.w/2, y: this.y+this.h/2};
  var targ_center = {x: obj.x+obj.w/2,   y: obj.y+obj.h/2};

  // figure out relative orientation
  var targ_is_left  = targ_center.x < self_center.x;
  var targ_is_below = targ_center.y < self_center.y;  // 'below' == smaller y
  var goal_quadrant = targ_is_left + 2*targ_is_below; // goal quadrant for self
  var goal_x = this.x - targ_is_left*this.w,
      goal_y = this.y - targ_is_below*this.h;

  // insert accordingly
  this.quadtree.root.inc_level();
  this.quadtree.root = new QNode({x:goal_x, y:goal_y, w:this.w*2, h:this.h*2,
				  level:0, parent:null,quadtree:this.quadtree});
  this.quadtree.root.refine();
  this.quadtree.root.children[goal_quadrant] = this; // memory leaks?
  this.quadtree.root.coarsen();
  this.quadtree.insert(obj);
};

// return a list of objects located in the given region
QNode.prototype.query = function(region, filter) {
  // set defaults
  region = region || {x:this.x, y:this.y, w:this.w, h:this.h};
  filter = typeof filter !== 'undefined' ? filter : function() { return true; };
  
  // don't return anything if outside query region
  if (!this.overlaps(region)) return [];

  // query children
  var ids = [].concat.apply([], this.children.map(
    function(c) { return c.query(region, filter); }
  ));

  // filter and add on own objects
  //filter = get_region_filter(region, this.quadtree.obj_ids);
  return ids.concat(this.get_ids().filter(filter));
};

// see if passed region overlaps this node
QNode.prototype.overlaps = function(region) {
  return overlaps(this, region);
};

// see if passed region contains this node
QNode.prototype.contains = function(region) {
  return contains(this, region);
};

QNode.prototype.get_accepting_child = function(region) {
  return get_accepting_child(this, region);
};

// increment all levels in the quadtree
QNode.prototype.inc_level = function() {
  this.level += 1;
  this.children.map( function(c) { c.inc_level(); } );
};

QNode.prototype.add_id = function(id) {
  // TODO
};

QNode.prototype.remove_id = function(id) {
  // try to remove from both lists
  if      (id in this.ids.unrefineable) delete this.ids.unrefineable[id];
  else if (id in this.ids.refineable)   delete this.ids.refineable[id];
};

QNode.prototype.get_ids = function() {
  return [].concat(Object.keys(this.ids.refineable),
		   Object.keys(this.ids.unrefineable));
};

// TODO: collapse these into one!
QNode.prototype.add_refineable = function(ids) {
  ids.map( function(id) { this.ids.refineable[id] = true;
			  this.quadtree.obj_to_node[id] = this.id; },
	   this );
};
QNode.prototype.add_unrefineable = function(ids) {
  ids.map( function(id) { this.ids.unrefineable[id] = true;
			  this.quadtree.obj_to_node[id] = this.id; },
	   this );
};

// TODO: collapse these into one!
// clear the ids from this node, updating the relevant datastructures
QNode.prototype.clear_refineable = function() {
  // remove references to this node from obj_to_node
  Object.keys(this.ids.refineable).map(
    function(id) { delete this.quadtree.obj_to_node[id]; }, this
  );
  
  // clear ids
  this.ids.refineable = {};
};
// clear the ids from this node, updating the relevant datastructures
QNode.prototype.clear_unrefineable = function() {
  // remove references to this node from obj_to_node
  Object.keys(this.ids.unrefineable).map(
    function(id) { delete this.quadtree.obj_to_node[id]; }, this
  );
  
  // clear ids
  this.ids.unrefineable = {};
};

// tell children to clear themselves
QNode.prototype.clear_children = function() {
  if (this.children.length !== 0) {
    this.children.map( function(c) { c.clear(); } );
  }
  // remove refs to children
  this.children = [];
};

// clear this node's ids and children
QNode.prototype.clear = function() {
  // TODO: memory leaks here???
  this.clear_refineable();
  this.clear_unrefineable();
  // tell children to clear
  this.clear_children();
  // remove self from node_ids
  delete this.quadtree.node_ids[this.id];
};

QNode.prototype.draw = function(rect) {
  rect.beginFill(0xFFFFFF, 0);
  rect.lineStyle(1, 0x000000);
  rect.drawRect(this.x, this.y, this.w, this.h);

  // then get children to draw
  if (this.children.length !== 0)
    this.children.map( function(c) { c.draw(rect); } );
}

// check if AABBs r1 and r2 overlap
function overlaps2(r1, r2) {
  // calculate centers and half-dimensions
  var r1hw = r1.w/2, r1hh = r1.h/2, r2hw = r2.w/2, r2hh = r2.h/2;
  var r1c = {x: r1.x+r1hw, y: r1.y+r1hh};
  var r2c = {x: r2.x+r2hw, y: r2.y+r2hh};
  
  // see if distance between centers is less than corresponding dimensions
  var dx = Math.abs(r1c.x - r2c.x);
  var dy = Math.abs(r1c.y - r2c.y);
  var x_sum = r1hw + r2hw;
  var y_sum = r1hh + r2hh;

  // overlapping if too close not to be
  return (dx < x_sum) && (dy < y_sum);
}

// http://stackoverflow.com/questions/306316/determine-if-two-rectangles-overlap-each-other
function overlaps(r1, r2) {
  var r1x2 = r1.x+r1.w, r1y2 = r1.y+r1.h;
  var r2x2 = r2.x+r2.w, r2y2 = r2.y+r2.h;
  return r1.x < r2x2 && r1x2 > r2.x && r1.y < r2y2 && r1y2 > r2.y;
}

// check if AABB r1 contains AABB r2 (allowing edge contact)
function contains(r1, r2) {
  return r1.x <= r2.x && r1.y <= r2.y &&
    r1.x+r1.w >= r2.x+r2.w &&
    r1.y+r1.h >= r2.y+r2.h;
}

function get_region_filter(region, obj_ids) {
  return function(id) { return overlaps(region, obj_ids[id]); };
}

function get_child_regions(region) {
  var hw = region.w/2, hh = region.h/2;
  return {1: {x:region.x,    y:region.y,    w:hw, h:hh},  // upper-left
	  2: {x:region.x+hw, y:region.y,    w:hw, h:hh},  // upper-right
	  3: {x:region.x,    y:region.y+hh, w:hw, h:hh},  // lower-left
	  4: {x:region.x+hw, y:region.y+hh, w:hw, h:hh}}; // lower-right
}

// return -1 or the index of the accepting child
function get_accepting_child(node, region) {
  var c = get_child_regions(node);
  return -1 + 1*contains(c[1], region) + 2*contains(c[2], region) +
    3*contains(c[3], region) + 4*contains(c[4], region);
}

// generate a random 'guid'
// stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
function UUID(){
  var d = performance.now();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x7|0x8)).toString(16);
  });
  return uuid;
}
