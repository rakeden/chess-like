# Graphics

[Graphics](https://pixijs.download/release/docs/scene.Graphics.html) is a complex and much misunderstood tool in the PixiJS toolbox.  At first glance, it looks like a tool for drawing shapes.  And it is!  But it can also be used to generate masks.  How does that work?

In this guide, we're going to de-mystify the `Graphics` object, starting with how to think about what it does.

Check out the [graphics example code](../../examples/graphics/simple).

## Graphics Is About Building - Not Drawing

First-time users of the `Graphics` class often struggle with how it works.  Let's look at an example snippet that creates a `Graphics` object and draws a rectangle:

```javascript
// Create a Graphics object, draw a rectangle and fill it
let obj = new Graphics()
  .rect(0, 0, 200, 100)
  .fill(0xff0000);

// Add it to the stage to render
app.stage.addChild(obj);
```

That code will work - you'll end up with a red rectangle on the screen.  But it's pretty confusing when you start to think about it.  Why am I drawing a rectangle when *constructing* the object?  Isn't drawing something a one-time action?  How does the rectangle get drawn the *second* frame?  And it gets even weirder when you create a `Graphics` object with a bunch of drawThis and drawThat calls, and then you use it as a *mask*.  What???

The problem is that the function names are centered around *drawing*, which is an action that puts pixels on the screen.  But in spite of that, the `Graphics` object is really about *building*.

Let's look a bit deeper at that `rect()` call.  When you call `rect()`, PixiJS doesn't actually draw anything.  Instead, it stores the rectangle you "drew" into a list of geometry for later use.  If you then add the `Graphics` object to the scene, the renderer will come along, and ask the `Graphics` object to render itself.  At that point, your rectangle actually gets drawn - along with any other shapes, lines, etc. that you've added to the geometry list.

Once you understand what's going on, things start to make a lot more sense.  When you use a `Graphics` object as a mask, for example, the masking system uses that list of graphics primitives in the geometry list to constrain which pixels make it to the screen.  There's no drawing involved.

That's why it helps to think of the `Graphics` class not as a drawing tool, but as a geometry building tool.

## Types of Primitives

There are a lot of functions in the `Graphics` class, but as a quick orientation, here's the list of basic primitives you can add:

* Line
* Rect
* RoundRect
* Circle
* Ellipse
* Arc
* Bezier and Quadratic Curve

In addition, you have access to the following complex primitives:

* Torus
* Chamfer Rect
* Fillet Rect
* Regular Polygon
* Star
* Rounded Polygon

There is also support for svg. But due to the nature of how PixiJS renders holes (it favours performance) Some complex hole shapes may render incorrectly. But for the majority of shapes, this will do the trick!

 ```ts
  let mySvg = new Graphics().svg(`
    <svg>
      <path d="M 100 350 q 150 -300 300 0" stroke="blue" />
    </svg>
   `);
```

## The GraphicsContext

Understanding the relationship between Sprites and their shared Texture can help grasp the concept of a `GraphicsContext`. Just as multiple Sprites can utilize a single Texture, saving memory by not duplicating pixel data, a GraphicsContext can be shared across multiple Graphics objects.

This sharing of a `GraphicsContext` means that the intensive task of converting graphics instructions into GPU-ready geometry is done once, and the results are reused, much like textures. Consider the difference in efficiency between these approaches:

Creating individual circles without sharing a context:
```ts
// Create 5 circles
for (let i = 0; i < 5; i++) {
  let circle = new Graphics()
    .circle(100, 100, 50)
    .fill('red');
}
```
Versus sharing a GraphicsContext:
```ts
// Create a master Graphicscontext
let circleContext = new GraphicsContext()
  .circle(100, 100, 50)
  .fill('red')

// Create 5 duplicate objects
for (let i = 0; i < 5; i++) {
  // Initialize the duplicate using our circleContext
  let duplicate = new Graphics(circleContext);
}
```

Now, this might not be a huge deal for circles and squares, but when you are using SVGs, it becomes quite important to not have to rebuild each time and instead share a `GraphicsContext`. It's recommended for maximum performance to create your contexts upfront and reuse them, just like textures!

```ts
let circleContext = new GraphicsContext()
  .circle(100, 100, 50)
  .fill('red')

let rectangleContext = new GraphicsContext()
  .rect(0, 0, 50, 50)
  .fill('red')

let frames = [circleContext, rectangleContext];
let frameIndex = 0;

const graphics = new Graphics(frames[frameIndex]);

// animate from square to circle:

function update()
{
  // swap the context - this is a very cheap operation!
  // much cheaper than clearing it each frame.
  graphics.context = frames[frameIndex++%frames.length];
}
```

If you don't explicitly pass a `GraphicsContext` when creating a `Graphics` object, then internally, it will have its own context, accessible via `myGraphics.context`. The [GraphicsContext](https://pixijs.download/release/docs/scene.GraphicsContext.html) class manages the list of geometry primitives created by the Graphics parent object. Graphics functions are literally passed through to the internal contexts:

```ts
let circleGraphics = new Graphics()
  .circle(100, 100, 50)
  .fill('red')
```
same as:
```ts
let circleGraphics = new Graphics()

circleGraphics.context
  .circle(100, 100, 50)
  .fill('red')
```

Calling `Graphics.destroy()` will destroy the graphics. If a context was passed to it via the constructor then it will leave the destruction of that context to you. However if the context is internally created (the default), when destroyed the Graphics object will destroy its internal `GraphicsContext`.

## Graphics For Display

OK, so now that we've covered how the `Graphics` class works, let's look at how you use it.  The most obvious use of a `Graphics` object is to draw dynamically generated shapes to the screen.

Doing so is simple.  Create the object, call the various builder functions to add your custom primitives, then add the object to the scene graph.  Each frame, the renderer will come along, ask the `Graphics` object to render itself, and each primitive, with associated line and fill styles, will be drawn to the screen.

## Graphics as a Mask

You can also use a Graphics object as a complex mask.  To do so, build your object and primitives as usual.  Next create a `Container` object that will contain the masked content, and set its `mask` property to your Graphics object.  The children of the container will now be clipped to only show through inside the geometry you've created.  This technique works for both WebGL and Canvas-based rendering.

Check out the [masking example code](../../examples/masks/graphics).

## Caveats and Gotchas

The `Graphics` class is a complex beast, and so there are a number of things to be aware of when using it.

**Memory Leaks**: Call `destroy()` on any `Graphics` object you no longer need to avoid memory leaks.

**Holes**: Holes you create have to be completely contained in the shape or else it may not be able to triangulate correctly. <!--TODO: primitive shapes not working on canvas?-->

**Changing Geometry**: If you want to change the shape of a `Graphics` object, you don't need to delete and recreate it.  Instead you can use the `clear()` function to reset the contents of the geometry list, then add new primitives as desired.  Be careful of performance when doing this every frame.

**Performance**: `Graphics` objects are generally quite performant.  However, if you build highly complex geometry, you may pass the threshold that permits batching during rendering, which can negatively impact performance. It's better for batching to use many `Graphics` objects instead of a single `Graphics` with many shapes.

**Transparency**: Because the `Graphics` object renders its primitives sequentially, be careful when using blend modes or partial transparency with overlapping geometry.  Blend modes like `ADD` and `MULTIPLY` will work *on each primitive*, not on the final composite image.  Similarly, partially transparent `Graphics` objects will show primitives overlapping. To apply transparency or blend modes to a single flattened surface, consider using AlphaFilter or RenderTexture.

<!--## Baking Into Texture

TODO: Advantages vs disadvantages of pre-rendering to a texture, using render texture: https://jsfiddle.net/bigtimebuddy/6tzyv91j/-->


s an object clockwise (0.0 - 2 * Math.PI) |
| **angle** | Angle is an alias for rotation that is specified in degrees instead of radians (0.0 - 360.0) |
| **pivot** | Point the object rotates around, in pixels - also sets origin for child objects |
| **alpha** | Opacity from 0.0 (fully transparent) to 1.0 (fully opaque), inherited by children |
| **scale** | Scale is specified as a percent with 1.0 being 100% or actual-size, and can be set independently for the x and y axis |
| **skew** | Skew transforms the object in x and y similar to the CSS skew() function, and is specified in radians |
| **visible** | Whether the object is visible or not, as a boolean value - prevents updating and rendering object and children |
| **renderable** | Whether the object should be rendered - when `false`, object will still be updated, but won't be rendered, doesn't affect children |

## Containers as Groups

Almost every type of display object is also derived from Container!  This means that in many cases you can create a parent-child hierarchy with the objects you want to render.

However, it's a good idea _not_ to do this.  Standalone Container objects are **very** cheap to render, and having a proper hierarchy of Container objects, each containing one or more renderable objects, provides flexibility in rendering order.  It also future-proofs your code, as when you need to add an additional object to a branch of the tree, your animation logic doesn't need to change - just drop the new object into the proper Container, and your logic moves the Container with no changes to your code.

So that's the primary use for Containers - as groups of renderable objects in a hierarchy.

Check out the [container example code](../../examples/basic/container).

## Masking

Another common use for Container objects is as hosts for masked content.  "Masking" is a technique where parts of your scene graph are only visible within a given area.

Think of a pop-up window.  It has a frame made of one or more Sprites, then has a scrollable content area that hides content outside the frame.  A Container plus a mask makes that scrollable area easy to implement.  Add the Container, set its `mask` property to a Graphics object with a rect, and add the text, image, etc. content you want to display as children of that masked Container.  Any content that extends beyond the rectangular mask will simply not be drawn.  Move the contents of the Container to scroll as desired.

```ts
// Create the application helper and add its render target to the page
let app = new Application({ width: 640, height: 360 });
document.body.appendChild(app.view);

// Create window frame
let frame = new Graphics({
  x:320 - 104,
  y:180 - 104
})
.rect(0, 0, 208, 208)
.fill(0x666666)
.stroke({ color: 0xffffff, width: 4, alignment: 0 })

app.stage.addChild(frame);

// Create a graphics object to define our mask
let mask = new Graphics()
// Add the rectangular area to show
 .rect(0,0,200,200)
 .fill(0xffffff);

// Add container that will hold our masked content
let maskContainer = new Container();
// Set the mask to use our graphics object from above
maskContainer.mask = mask;
// Add the mask as a child, so that the mask is positioned relative to its parent
maskContainer.addChild(mask);
// Offset by the window's frame width
maskContainer.position.set(4,4);
// And add the container to the window!
frame.addChild(maskContainer);

// Create contents for the masked container
let text = new Text({
  text:'This text will scroll up and be masked, so you can see how masking works.  Lorem ipsum and all that.\n\n' +
  'You can put anything in the container and it will be masked!',
  style:{
    fontSize: 24,
    fill: 0x1010ff,
    wordWrap: true,
    wordWrapWidth: 180
  },
  x:10
});

maskContainer.addChild(text);

// Add a ticker callback to scroll the text up and down
let elapsed = 0.0;
app.ticker.add((ticker) => {
  // Update the text's y coordinate to scroll it
  elapsed += ticker.deltaTime;
  text.y = 10 + -100.0 + Math.cos(elapsed/50.0) * 100.0;
});
```

There are two types of masks supported by PixiJS:

Use a [Graphics](https://pixijs.download/release/docs/scene.Graphics.html) object to create a mask with an arbitrary shape - powerful, but doesn't support anti-aliasing

Sprite: Use the alpha channel from a [Sprite](https://pixijs.download/release/docs/scene.Sprite.html) as your mask, providing anti-aliased edging - _not_ supported on the Canvas renderer

## Filtering

Another common use for Container objects is as hosts for filtered content.  Filters are an advanced, WebGL/WebGPU-only feature that allows PixiJS to perform per-pixel effects like blurring and displacements.  By setting a filter on a Container, the area of the screen the Container encompasses will be processed by the filter after the Container's contents have been rendered.

Below are list of filters available by default in PixiJS. There is, however, a community repository with [many more filters](https://github.com/pixijs/filters).

| Filter                                                                                 | Description                                                                                                   |
| ---                                                                                    | ---                                                                                                           |
| AlphaFilter                      | Similar to setting `alpha` property, but flattens the Container instead of applying to children individually. |
| BlurFilter                         | Apply a blur effect                                                                                           |
| ColorMatrixFilter   | A color matrix is a flexible way to apply more complex tints or color transforms (e.g., sepia tone).          |
| DisplacementFilter | Displacement maps create visual offset pixels, for instance creating a wavy water effect.                     |
| NoiseFilter                      | Create random noise (e.g., grain effect).                                                                     |

Under the hood, each Filter we offer out of the box is written in both glsl (for WebGL) and wgsl (for WebGPU). This means all filters should work on both renderers.

_**Important:** Filters should be used somewhat sparingly. They can slow performance and increase memory usage if used too often in a scene._