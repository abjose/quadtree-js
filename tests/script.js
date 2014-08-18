// pixi.js test - copied from example 1 (rotating bunny)

/* TODO
- do functions need semicolons after? lolz
- MAKE THINGS CLASSY
- and drag to translate :D!
- samer wants physics
- allow adding new rects!
- and scaling!
- and...drawing?!
- probably doesn't make sense to use overflow: hidden for everything - 
  maybe once larger than a certain size should break? Or...never break?
- switch movement to using translate instead of absolute positioning?
- get everything to scale :O :OOOOOOO (randomly? on scroll?)
- get cursor to be in proper place when clicking to edit
- figure out how to add hidden(?) text so can be indexed - add inside
  canvas tag as fallback?
- seems like transform css doesn't work in chrome - need to use the chrome-
  specific ones?
- make only redraw stuff when necessary
- could use cacheAsBitmap when moving around 'background' (including windows?)
- why does html_sprite always seem to have padding on top?
- rasterizeHTML's ZOOM option seems like it might be useful!
- make more 'reactive' - only animate when necessary?
  http://www.html5gamedevs.com/topic/2866-call-renderer-only-when-needed/
- consider changing again - canvas when not touching, to div when moused over
  (or clicked/tapped once?) to textarea when clicked (or clicked/tapped twice).
  This way easy to scroll through / follow links without reverting to plain-text
- can just use iframe instead of div? or...could use iframe for displaying
  other websites?
- allow key event detection in multiple directions at once
- add stuff to allow deletion deletion!!!!
*/

/*
make sure to pull out quadtree demo!!
kinda nice to change animations to only redraw affected squares

STEPS 4 SCALING
- detect scroll events

OBJECTIFY
- pull out demo beforehand?
- make basic object - 'Rectangle'??
  should keep track of its location and bounds
  how to help deal with scaling?
*/


var WIDTH  = window.innerWidth,
HEIGHT = window.innerHeight;
var WEIRD_PADDING = 10;

// create a new instance of a pixi stage
var interactive = true;
var stage = new PIXI.Stage(0x66FF99, interactive);
// add temporary click callback
stage.click = insert_rectangle;

// create a renderer instance
//var renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT);
//var renderer = new PIXI.WebGLRenderer(WIDTH, HEIGHT);
var renderer = new PIXI.CanvasRenderer(WIDTH, HEIGHT);

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
  case 37: viewrect.x -= 5; break; // left
  case 38: viewrect.y -= 5; break; // up
  case 39: viewrect.x += 5; break; // right
  case 40: viewrect.y += 5; break; // down
  }
  
}, false);

// get the box to move around
var textbox = document.getElementById("textbox");
var rect_clicked = false; // UGLY HACK?
// set callback for when it loses focus
$(textbox).blur(restore_pixi_text);
// make other things lose focus on click
$(renderer.view).click(function(event) {
  if (!rect_clicked) {
    $(textbox).blur();
  }
  rect_clicked = false;
});

// add a rectangle
var rect_graphics = new PIXI.Graphics();
rect_graphics.beginFill(0x999999);
rect_graphics.drawRect(0, 0, 50, 30);
rect_graphics.interactive = true;
rect_graphics.buttonMode = true;
//stage.addChild(rect_graphics);

// add click callback
var mouse_x = 0,
mouse_y = 0;
rect_graphics.setInteractive(true);
rect_graphics.click = insert_textbox;
rect_graphics.mousedown = function(mouseData) {
  dragging = true;
};
rect_graphics.mousemove = function(mouseData) {
  mouse_x = mouseData.global.x;
  mouse_y = mouseData.global.y;
};
rect_graphics.mouseup   = function(mouseData) {
  dragging = false;
};

// rectangle's velocities...ugly to have global
// will need to make into an object / 'class'
var rect_x = 10;
var rect_y = 10;
var rect_w = 70;
var rect_h = 70;
var rect_vel_x = -1;
var rect_vel_y = -2;

// dragging stuff
var dragging = false;

// test dom rendering stuff
var empty_canvas = document.createElement('canvas');
var test_tex = PIXI.Texture.fromCanvas(empty_canvas);
var html_sprite = new PIXI.Sprite(test_tex);
html_sprite.position.x = 100;
html_sprite.position.y = 100;
stage.addChild(html_sprite);

// start with rendered text on div - think only works with canvas
restore_pixi_text();


function animate() {
  requestAnimFrame(animate);
  
  // bounce canvas rectangle
  //bounce(); // will have to change this to bounce multiple rects..
  if (dragging) {
    rect_x = mouse_x;
    rect_y = mouse_y;
  }

  // draw the quadtree
  draw_qt();
  highlight_rects();

  /*
  // update graphics
  rect_graphics.clear()
  rect_graphics.beginFill(0x999999);
  // how to do without redrawing everything? 
  rect_graphics.drawRect(rect_x, rect_y, rect_w, rect_h);
  rect_graphics.hitArea = new PIXI.Rectangle(rect_x, rect_y, rect_w, rect_h);

  // resize rectangle to match textbox
  rect_w = textbox.offsetWidth;
  rect_h = textbox.offsetHeight;

  // move html sprite to match
  html_sprite.position.x = rect_x;
  html_sprite.position.y = rect_y - WEIRD_PADDING; // why why why why why why 
  //html_sprite.scale.x = 25;
  remember to uncomment stage.add stuff for rectangle
  */

  // render the stage
  renderer.render(stage);
};

// draw the bounds of the quadtree
function draw_qt() {
  // just need to draw a rectangle for every child, top-down
  // hmm, easier to just add a small drawing function to QNode? ehhh.
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
  // TODO: Move this stuff out of here to a demo file for quadtree?
  //       or just copy into a demo to keep for later...
  // should recolor all default color, then color highlighted ones different?
  // instead of redrawing everything all the time
  var all = qt.query(null, false);
  var mouse = stage.getMousePosition();
  var ids = qt.query({x:mouse.x-viewrect.x, y:mouse.y-viewrect.y,
		      w:1, h:1}, false);
  
  for (var i=0; i < all.length; i++) {
    var obj = qt.obj_ids[all[i]];
    obj.rect.clear();
    obj.rect.beginFill(0x0077AA);
    obj.rect.drawRect(obj.x+viewrect.x, obj.y+viewrect.y, obj.w, obj.h);
  }
  for (var i=0; i < ids.length; i++) {
    var obj = qt.obj_ids[ids[i]];
    obj.rect.clear();
    obj.rect.beginFill(0xFF0000);
    //obj.rect.drawRect(obj.x, obj.y, obj.w, obj.h);
    obj.rect.drawRect(obj.x+viewrect.x, obj.y+viewrect.y, obj.w, obj.h);
  }
};

function insert_textbox(mouseData) {
  // position appropriately
  textbox.style.top  = rect_y + 'px';
  textbox.style.left = rect_x + 'px';
  //textbox.style.transform = 'scale(.25)';
  // make div appear and make focused
  $(textbox).css('visibility', 'visible');
  $(textbox).focus();
  // update textbox_showing
  rect_clicked = true;
  // remove pixi text
  html_sprite.setTexture(PIXI.Texture.fromCanvas(empty_canvas)); 
};

function restore_pixi_text(mouseData) {
  // replace pixi text
  render_textbox($(textbox).val(), rect_w, rect_h);
  // hide div
  $(textbox).css('visibility', 'hidden');
};

function render_textbox(text, width, height) {
  // dangerous??? couldn't someone just pass in arbitrary HTML?
  // get html from markdown
  var markdown_html = markdown.toHTML(text);

  // make style sheet?
  var render_style = "<style>body{"+
    "margin: 0px;"+
    "border: 0px solid;"+
    "padding: 0px;"+
    "font-size: 12px;"+
    "font-family: 'Courier New';"+
    "width:"+width+"px;"+
    "height:"+(height+WEIRD_PADDING)+"px;"+
    "overflow: hidden;"+
    "}</style>";

  // combine stylesheet and html
  markdown_html = render_style + markdown_html;
  
  // render and update sprite
  rasterizeHTML.drawHTML(markdown_html, {zoom: 1})
    .then(function success(renderResult) {
      html_sprite.setTexture(PIXI.Texture.fromCanvas(renderResult.image)); 
    }, function error(e) {
      console.log('rendering error!');
      console.log(e);
    });
};
