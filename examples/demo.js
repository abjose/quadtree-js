// demo.js test - copied from example 1 (rotating bunny)

/* TODO
- only redraw highlights when necessary
*/

var WIDTH  = window.innerWidth,
    HEIGHT = window.innerHeight;

// create a new instance of a pixi stage
var interactive = true;
var stage = new PIXI.Stage(0x66FF99, interactive);
// add temporary click callback
stage.click = insert_rectangle;

// create a renderer instance
var renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT);

// add the renderer view element to the DOM
document.body.appendChild(renderer.view);
requestAnimFrame(animate);

// quadtree stuff
var qt = new Quadtree({x:150, y:320, w:100, h:100});
var qt_rect = new PIXI.Graphics();
stage.addChild(qt_rect);

// view stuff
var viewrect = {};
viewrect.x = 0;
viewrect.y = 0;
viewrect.w = WIDTH;
viewrect.h = HEIGHT;

window.addEventListener('keydown', function(event) {
  event.preventDefault();
  switch (event.keyCode) {
  case 37: viewrect.x -= 15; break; // left
  case 38: viewrect.y -= 15; break; // up
  case 39: viewrect.x += 15; break; // right
  case 40: viewrect.y += 15; break; // down
  }
}, false);

function animate() {
  requestAnimFrame(animate);
  
  // draw the quadtree
  draw_qt();
  highlight_rects();

  // render the stage
  renderer.render(stage);
};

// draw the bounds of the quadtree
function draw_qt() {
  qt_rect.clear();
  qt_rect.x = viewrect.x; qt_rect.y = viewrect.y;
  qt.root.draw(qt_rect);
};

// insert a random-sized rectangle wherever we clicked
function insert_rectangle(mouseData) {
  var max_w = 5, max_h = 5;
  var rect   = new PIXI.Graphics();
  var qt_obj = {x:mouseData.global.x-viewrect.x,
		y:mouseData.global.y-viewrect.y,
		w:max_w, h:max_h,
		//w:Math.random()*max_w, h:Math.random()*max_h,
		id:UUID(), rect:rect};
  // fill in
  rect.beginFill(0x0077AA);
  rect.drawRect(qt_obj.x+viewrect.x, qt_obj.y+viewrect.y, qt_obj.w, qt_obj.h);
  stage.addChild(rect);

  // insert into quadtree!
  qt.insert(qt_obj);
};

// when mouse over part of quadtree, highlight those things
function highlight_rects() {
  var all = qt.query(null, false);
  var mouse = stage.getMousePosition();
  // specifically ask for no filtering
  var ids = qt.query({x:mouse.x-viewrect.x, y:mouse.y-viewrect.y,
		      w:1, h:1}, false);

  // recolor everything
  for (var i=0; i < all.length; i++) {
    var obj = qt.obj_ids[all[i]];
    obj.rect.clear();
    obj.rect.beginFill(0x0077AA);
    obj.rect.drawRect(obj.x+viewrect.x, obj.y+viewrect.y, obj.w, obj.h);
  }
  // 'highlight' moused-over nodes
  for (var i=0; i < ids.length; i++) {
    var obj = qt.obj_ids[ids[i]];
    obj.rect.clear();
    obj.rect.beginFill(0xFF0000);
    obj.rect.drawRect(obj.x+viewrect.x, obj.y+viewrect.y, obj.w, obj.h);
  }
};
