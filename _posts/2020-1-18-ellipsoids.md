---
title: "Ellipsoids"
date: 2020-1-18 20:10:33 -0000
categories: blog
tags:
  - Ellipsoid
  - Raytracing
  - Optics
toc: true
---

[Ellipsoids](https://en.wikipedia.org/wiki/Ellipsoid) are spheres that have been stretched about one or more axes.

We can construct [useful ellipsoids](https://en.wikipedia.org/wiki/Spheroid#Prolate_spheroids) from two special points, called the "Foci".
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
<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" orbit="enabled"></script>

```
ellipsoid = new Sphere(radius = 0.5);
ellipsoid.position = (focus1 + focus2) / 2;
ellipsoid.rotation = orientZFromTo(focus1, focus2);
majorAxis = sqrt(pow(interFociDistance / 2, 2) + 
                 pow(minorAxis         / 2, 2)) * 2;
ellipsoid.scale = Vec3(minorAxis, minorAxis, majorAxis );
```

#### Foci

The Foci of Ellipsoids possess a very useful property:

All rays that pass through one focus will always pass through the other focus when reflected from the internal surface of the ellipsoid.

<script type="text/javascript" src="../../assets/js/Ellipsoids/EllipsoidRaytracer.js" inverted="enabled" projector="enabled" orbit="enabled"></script>

In addition, the path length of each of these rays will be the same.

#### Optics

These properties make ellipsoids ideal for a number of tasks in Optics that require reflecting light from one point to another.
