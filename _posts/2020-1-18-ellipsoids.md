---
title: "Ellipsoidal Mirrors"
date: 2020-1-18 20:10:33 -0000
categories: blog
tags:
  - Ellipsoid
  - Raytracing
  - Optics
toc: true
---

[Ellipsoids](https://en.wikipedia.org/wiki/Ellipsoid) are spheres that have been stretched about one or more axes.

We can construct useful ellipsoidal mirrors called ["Prolate Spheroids"](https://en.wikipedia.org/wiki/Spheroid#Prolate_spheroids) from two special points, called the "Foci".
<!-- Hide the Table of Contents (but keep the navigation :^) ... -->
<script type="text/javascript">
  document.getElementsByClassName('toc')[0].style.display = 'none';
</script>
<!-- Load the Three.js library, assorted helpers, and the actual line fitting script code... -->
<script type="text/javascript" src="../../assets/js/three.js"></script>
<script type="text/javascript" src="../../assets/js/DragControls.js"></script>
<script type="text/javascript" src="../../assets/js/OrbitControls.js"></script>
<script type="text/javascript" src="../../assets/js/IK/Environment.js"></script>
<script type="text/javascript" src="../../assets/js/Ellipsoids/Ellipsoid.js"></script>
<script type="text/javascript" src="../../assets/js/Ellipsoids/LineDrawer.js"></script>
<script type="text/javascript" src="../../assets/js/Ellipsoids/Projector.js"></script>
<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="0" orbit="enabled"></script>

~~~ javascript
ellipsoid = new Sphere(radius = 0.5);
ellipsoid.position = (focus1 + focus2) / 2;
ellipsoid.rotation = orientZFromTo(focus1, focus2);
majorAxis = sqrt(pow(interFociDistance / 2, 2) + 
                 pow(minorAxis         / 2, 2)) * 2;
ellipsoid.scale = Vec3(minorAxis, minorAxis, majorAxis );
~~~

#### Raytracing Ellipsoids 

Ellipsoids, as we're about to see, have some very special optical properties.  So it's useful to be able to raytrace against them quickly to determine how light will interact with them.

Conceptually, the simplest method is to transform both the ray origin and ray direction into the stretched coordinate space of the sphere.  This allows us to raytrace against the sphere directly.  We can then transform that hit point (and normal) out of the stretched coordinate space to use it.

<div class="togglebox">
  <input id="toggle2" type="checkbox" name="toggle" />
  <label for="toggle2">Show Code</label>
  <section id="content2" markdown="1" >
~~~ javascript
function raytraceEllipsoid (rayOrigin, rayDirection) {
  sphereSpaceRayOrigin    =  worldToSphereMatrix *  rayOrigin;
  sphereSpaceRayDirection = (worldToSphereMatrix * (rayOrigin + rayDirection)) - sphereSpaceRayOrigin).normalized;
  intersectionTime        = intersectRaySphere(sphereSpaceRayOrigin, sphereSpaceRayDirection, Vector3.zero, radius, insideSurface = true);
  if (intersectionTime > 0) {
    sphereSpaceHitPoint   = sphereSpaceRayOrigin + (sphereSpaceRayDirection * intersectionTime));
    hitPoint              = worldToSphereMatrix.inverse * sphereSpaceHitPoint;
    return hitPoint;
  } else {
    return null; // We didn't hit
  }
}
~~~
<a href="https://github.com/zalo/zalo.github.io/blob/master/assets/js/Ellipsoids/Ellipsoid.js#L60-L94"><small>See Full Source</small></a>
  </section>
</div>

#### Foci Mirrors 

Now, the Foci of Ellipsoids possess two very useful properties:

 1. The sum of distances from the foci to any point on the ellipsoid will add to a constant number.  (This is true, [even for ellipsoids with more than two foci!](https://en.wikipedia.org/wiki/N-ellipse))

 2. All rays that pass through one focus will always pass through the other focus when reflected from the internal surface of the ellipsoid.

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="0" inverted="enabled" projector="enabled" projectorFoV="165" orbit="enabled"></script>

Due to property 1., the path length of each of these rays will be the same.

#### Chaining Ellipsoidal Mirrors 

One may even chain ellipsoids together by their their foci to reflect light through an arbitrary path.

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="1" inverted="enabled" projector="enabled" projectorFoV="120" orbit="enabled"></script>

It is also possible to switch some of the ellipsoidal reflectors to convex surfaces, as long as there is a concave reflector afterward to collect the rays again.

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="2" inverted="enabled" projector="enabled" projectorFoV="120" orbit="enabled"></script>

This configuration is a special case of an optical system called an "Offner Relay".  Convex mirrors inserted into the optical path tend to reverse the aberrations caused by the concave mirrors (and visa-versa).

<div class="togglebox">
  <input id="toggle1Long" type="checkbox" name="toggle" />
  <label for="toggle1Long">The Only Limit Is Your Imagination</label>
  <section id="content1Long" markdown="1" >
<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="3" inverted="enabled" projector="enabled" projectorFoV="120" orbit="enabled"></script>

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="4" inverted="enabled" projector="enabled" projectorFoV="120" orbit="enabled"></script>
  </section>
</div>

#### Fresnel Reflectors 

Simple ellipsoidal optics are rare due to their bulk.  This trade-off is apparent in [Project North Star's "Bird Bath" combiners](http://blog.leapmotion.com/north-star-open-source/).  When designing it, we chose to sacrifice form-factor for field-of-view and image quality.

Nearly all methods of reducing size (additional optical elements, folding the path, using holographic elements, etc.) tend increase both optical aberrations and cost.  Aberrations tend to accumulate the more times light reflects or refracts through a surface.

However, there may be one powerful way to move light around while keeping the benefits of a single-bounce reflector...

<script type="text/javascript" src="../../assets/js/Ellipsoids/FresnelEllipsoid.js" orbit="enabled"></script>

Simply take planar slices of many confocal ellipsoids to approximate a larger ellipsoid.  We can preserves the optical properties of the ellipsoid, while reducing its form-factor!

* Note how these slices emulate a refracting lens when the two foci are on opposite sides of the plate.

#### Practical Fresnel Reflectors

This is a relatively complex shape to assemble.  [There are great guides for building large, simplfied fresnel reflectors at home to focus sunlight.](http://www.dr-iguana.com/prj_FlatPackMirror/index.html)

However, for near-eye displays, I believe that embedding these mirrored surfaces within clear material is the most viable near-term structure.

I see two primary paths towards constructing them:

* Machining a Mold (High Volume, Slow Turnaround)
 1. Use [Wire EDM](https://www.youtube.com/watch?v=pBueWfzb7P0) to cut slices from many [traditionally machined ellipsoidal mirrors](https: /www.edmundoptics.com/p/254mm-sq-2x-protected-aluminum-off-axis-ellipsoidal-mirror/41614/).  
 2. Assemble these pieces concentrically to produce a mold.
 3. This mold can be used to cast the first half of the part from a clear material like resin, epoxy, plastic, or glass.
 4. Sputter or coat this internal surface with a 50% mirror coating.
 5. Cast this part with the same material to produce a flat upper surface (to eliminate changes in refractive index at the internal mirror's surface).
 6. Coat the smooth exterior of the part with an antireflective film to minimize secondary reflections.

* 3D Printing (Low Volume, Quick Turnaround)
 1. Use an optical rapid-prototyping company like [Luxexcel](https://www.luxexcel.com/) to simply print one half of the part.  
  * One may print a larger cross-section than is necessary, and shave it down afterwards to accomodate the printing processes' poor handling of discontinuities.
 
Afterwards, one may follow steps 4-6 from the first process.

* * *

* Though the flat-plate structure of this technique undoes much of the [field-curvature (or "Petzval") aberration](https://en.wikipedia.org/wiki/Petzval_field_curvature) of traditional ellipsoidal reflectors, this technique can easily be extended to curved structures to suit even better form factors.
