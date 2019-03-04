---
title: "Orthonormalization"
date: 2019-3-2 20:10:33 -0000
categories: blog
tags:
  - Cross Covariance Matrix
  - Rotation Matrix
  - Polar Decomposition
toc: true
---

A rotation matrix is really just an orthonormal basis (a set of three orthogonal, unit vectors representing the x, y, and z bases of your rotation).

Often times when doing vector math, you'll want to find the closest rotation matrix to a set of vector bases.  The cheapest/default way is [Gram-Schmidt Orthonormalization](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process).  This process works in n-dimensions using vector projection.

A similar algorithm can be done in 3D with cross products:
```
xBasis = xBasis.normalized;
yBasis = cross(zBasis, xBasis).normalized;
zBasis = cross(xBasis, yBasis).normalized;
```

This algorithm is nice because it is short, analytic, and trivially differentiable (which can be useful in machine learning!)

However, this algorithm is dependent on the order in which you solve the bases.  The input x-direction is unmodified, the y-direction is just perpendicular to that, and the input z-direction isn't even taken into account!  It is by no means *the* optimal orthonormal matrix.

### Robust Polar Decomposition

The solution to this problem came from my favorite paper of 2016: [Matthias Müller's Polar Decomposition](https://animation.rwth-aachen.de/media/papers/2016-MIG-StableRotation.pdf).   

This paper offers a cheap, branchless iterative approximation to the orthonormalization problem that is extremely robust, where the error is spread out evenly across the three bases.  The secret is that, instead of trying to find the optimal _orthonormal matrix_, it finds the the optimal _rotation_ that matches an identity basis with the input basis.

You can play with it here
<!-- Hide the Table of Contents (but keep the navigation :^) ... -->
<script type="text/javascript">
  document.getElementsByClassName('toc')[0].style.display = 'none';
</script>
<!-- Load the Three.js library, assorted helpers, and the actual line fitting script code... -->
<script type="text/javascript" src="../../assets/js/three.js"></script>
<script type="text/javascript" src="../../assets/js/DragControls.js"></script>
<script type="text/javascript" src="../../assets/js/OrbitControls.js"></script>
<script type="text/javascript" src="../../assets/js/IK/Environment.js"></script>
<script type="text/javascript" src="../../assets/js/PolarDecomposition/PolarDecomposition.js" orbit="enabled"></script>

This algorithm looks like this
```
for (iter = 0; iter < iterations; iter++) {
  setBasesFromQuaternion(curQuaternion, curXBasis, curYBasis, curZBasis);
  omega = (cross(curXBasis, inputXBasis) +
           cross(curYBasis, inputYBasis) +
           cross(curZBasis, inputZBasis)) / 
       abs(dot(curXBasis, inputXBasis) +
           dot(curYBasis, inputYBasis) +
           dot(curZBasis, inputZBasis) + 0.000000001f);
  w = omega.magnitude;
  if (w < 0.000000001f) break;
  curQuaternion = angleAxis(w, omega / w) * curQuaternion;
}
```

Or, in English, it executes these steps:
  1) Construct the torque ("tension") between its current orthogonal estimate of each basis and each input basis
  2) Take the average of all the torques summed together
  3) Apply this torque to its current rotation estimate via an Angle-Axis Quaternion

When there is no more torque left to apply, the `curQuaternion` has converged on the optimal rotation fitting the orthonormal basis (at least according to the "Frobenius Norm").

### Applications

Matthias uses this technique to great effect in Nvidia FleX's Cluster Shape Matching Solver
{% include video id="YOBjHpoImu8?t=74" provider="youtube" %}

It is a part of the algorithm that solves for the optimal rigid transformation between two sets of points.

This simple application is called the ["Kabsch Algorithm"](https://github.com/zalo/mathutilities#kabsch).  The Polar Decomposition stands in for the SVD here.

I have found the concept of quaternion torque averaging to be useful when taking the [spherical average of multiple quaternions](https://github.com/zalo/MathUtilities/blob/master/Assets/Kabsch/AverageQuaternion.cs), and when performing [fast mesh deformation](https://github.com/zalo/MathUtilities#generalized-mesh-deformation).

It can often be used as an iterative, real-time substitute for an SVD.  It can even be extended to any number of dimensions (which support constructing angle-axis rotations of course).

### The Future?

Given that this algorithm is often located in the hottest regions of the program, there is a lot of pressure to optimize it even further.

A short while ago, I had an idea:
> shouldn't you be able to orthonormalize rotation matrices by iteratively applying an orthogonality constraint via the cross product?  Then you wouldn't need Quaternions!

Instead of iteratively rotating a basis to match the input, one might just "unfold" the input to its closest orthogonal representation.

So I set about putting this down into algorithm form...
```
mB = [ inX.magnitude, inY.magnitude, inZ.magnitude ];
for (int iter = 0; iter < 9; iter++) {
  unitX = (cross(inY, inZ) + inX).normalized;
  unitY = (cross(inZ, inX) + inY).normalized;
  unitZ = (cross(inX, inY) + inZ).normalized;
  inX = unitX * mB[0]; inY = unitY * mB[1]; inZ = unitZ * mB[2];
}
```

And you can play with the result here
<script type="text/javascript" src="../../assets/js/PolarDecomposition/PolarDecomposition.js" orbit="enabled" crossProductDecomposition="enabled"></script>
(the cyan basis is the cross-product function, and the colored basis is the quaternion torque function)

See any issues?

It converges almost instantly compared to the quaternion torque technique, and it matches up perfectly... except for when it doesn't.

It's good enough that I think the concept is sound, but there's something off in the implementation.   The common wisdom in vector math is that normalization is a sign of weak understanding; it's highly likely that if those `normalized`'s are replaced with dot products in the right way, it will evaluate more quickly _and_ converge on the correct answer.

If you can figure out the mystery of the faster optimal orthonormal matrix, I would like to hear from you!

(No, seriously, please shoot me an e-mail; I am enormously interested in hearing your solutions!)