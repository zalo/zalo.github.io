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

We can construct [useful ellipsoidal mirrors](https://en.wikipedia.org/wiki/Spheroid#Prolate_spheroids) from two special points, called the "Foci".
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

```
ellipsoid = new Sphere(radius = 0.5);
ellipsoid.position = (focus1 + focus2) / 2;
ellipsoid.rotation = orientZFromTo(focus1, focus2);
majorAxis = sqrt(pow(interFociDistance / 2, 2) + 
                 pow(minorAxis         / 2, 2)) * 2;
ellipsoid.scale = Vec3(minorAxis, minorAxis, majorAxis );
```

#### Foci Mirrors

The Foci of Ellipsoids possess a very useful property:

All rays that pass through one focus will always pass through the other focus when reflected from the internal surface of the ellipsoid.

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="0" inverted="enabled" projector="enabled" projectorFoV="165" orbit="enabled"></script>

In addition, the path length of each of these rays will be the same.

#### Chaining Ellipsoidal Mirrors

One may even chain ellipsoids together by their their foci to reflect light through an arbitrary path.

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="1" inverted="enabled" projector="enabled" projectorFoV="120" orbit="enabled"></script>

It is also possible to switch some of the ellipsoidal reflectors to convex surfaces, as long as there is a concave reflector afterward to collect the rays again.

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="2" inverted="enabled" projector="enabled" projectorFoV="120" orbit="enabled"></script>

This configuration is a special case of an optical system called an "Offner Relay".  Convex mirrors inserted into the optical path tend to reverse the aberrations caused by the concave mirrors (and visa-versa).

#### The Only Limit Is Your Imagination

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="3" inverted="enabled" projector="enabled" projectorFoV="120" orbit="enabled"></script>

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" config="4" inverted="enabled" projector="enabled" projectorFoV="120" orbit="enabled"></script>
