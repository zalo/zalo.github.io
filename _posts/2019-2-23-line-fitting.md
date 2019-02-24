---
title: "Line Fitting in 3D"
date: 2019-2-23 16:10:33 -0000
categories: blog
tags:
  - Least Squares
  - Line Fitting
  - Lines
toc: true
---

Orthogonal Regression is the process of finding the line that best fits a set of points by minimizing their squared _orthogonal_ distances to it.

<!-- Hide the Table of Contents (but keep the navigation :^) ... -->
<script type="text/javascript">
  document.getElementsByClassName('toc')[0].style.display = 'none';
</script>
<!-- Load the Three.js library, assorted helpers, and the actual line fitting script code... -->
<script type="text/javascript" src="../../assets/js/three.js"></script>
<script type="text/javascript" src="../../assets/js/DragControls.js"></script>
<script type="text/javascript" src="../../assets/js/OrbitControls.js"></script>
<script type="text/javascript" src="../../assets/js/IK/Environment.js"></script>
<script type="text/javascript" src="../../assets/js/LineFitting/LineFitting.js" orbit="enabled"
    residuals="enabled"></script>

This is more powerful than traditional least squares in that it is invariant to global rotation.

Because of this, however, it has no analytic solution in 3D*.  There are a variety of iterative solutions available, but they often depend on an operation called the **Singular Value Decomposition** or **SVD**.  SVDs are a complex matrix decomposition that are usually only found in heavy-weight matrix libraries.  Avoiding the inlusion of these libraries is the motivation for the technique outlined in this post.

### The Centroid

The first key insight is that the orthogonal regression line will always pass through the average (or _centroid_) of the points.

The centroid can be computed by adding the points together, and then dividing by the number of points.
```
centroid = Vector3.zero;
foreach point in points {
  centroid += point;
}
centroid /= points.count;
```
<script type="text/javascript" src="../../assets/js/LineFitting/VisualizeAverage.js" orbit="enabled"></script>

Now that we have a point that the line passes through, we just need to calculate its direction.

### Getting Closer

Since this algorithm is iterative, we need an iteration function that gets us _closer_ to the true line direction at each step.

We can choose almost any** direction to start, and we'll iteratively work toward the real direction.

The key to calculating the next direction estimate is to multiply each point by the dot product of it and the current estimate.   This moves all the points to the same hemisphere as the current guess, allowing you to simply sum them and normalize them for the new direction estimate.

```
// Solve for the centroid (See Above)
nextDirection = Vector3.zero;
foreach point in points {
  centeredPoint = point - centroid;
  nextDirection += dot(centeredPoint, direction) * centeredPoint;
}
direction = nextDirection.normalize();
```
<script type="text/javascript" src="../../assets/js/LineFitting/LineStepping.js" orbit="enabled"></script>

No matter what** direction you choose as your initial guess, the next calculated direction will have moved toward the true line of best fit direction.

### A Virtuous Cycle

The end is in sight, all we have to do now is run the stepping routine repeatedly to converge on the line of best fit.

```
// Solve for the centroid (See Above)
for(i = 0; i < iterations; i++){
 // Step the best fit line direction (See Above)
}
```
<script type="text/javascript" src="../../assets/js/LineFitting/LineFitting.js" orbit="enabled" residuals="disabled"></script>

No SVD's required!


<small>
(* There _might_ be an analytic 3D solution [with quaternions](https://en.wikipedia.org/wiki/Deming_regression#Orthogonal_regression), but I have not been able to get this technique to work when the points leave the XY plane (whereas the technique presented above works in any number of dimensions).  [The Unity code I've been using to test this "quaternion-based" fitting is here](https://github.com/zalo/MathUtilities/blob/master/Assets/LeastSquares/LeastSquaresFitting.cs#L163-L179) )
</small>

### Sequential Down Projection for Secondary Axes

Typically one might extend the line fitting code to fit planes by projecting the points onto the plane defined by the primary axis, and then fitting the secondary axis on that flattened set of points.

```
// Solve for the centroid (See Above)
// Fit Primary Axis with normal points(See Above)
foreach(point in points){
  flattenedPoints.push(projectOnPlane(point, primaryAxis));
} 
// Fit Secondary Axis with flattened points (See Above)
normal = cross(primaryAxis, secondaryAxis).normalized;
```

### Abusing Singularities for Fun and Profit

** The observant among you might have noticed that there exist starting angles where the progress towards the true fitting line is **0**.  This is actually a singularity that occurs when the starting guess is perfectly orthogonal to the true answer.   <small>One should check for these cases, though it's rare in practice.</small>

However, it turns out we can abuse this singularity to fit all of the axes simultaneously!  Instead of projecting the _points_ onto the plane defined by the primary axis, we project the current estimation of the secondary axis itself!  This lets us solve for both the primary and secondary axes simultaneously!

```
// Solve for the centroid (See Above)
for (int iter = 0; iter < iters; iter++) {
  newPrimaryAxis = Vector3.zero, newSecondaryAxis = Vector3.zero;
  foreach(point in points) {
    point = worldSpacePoint - origin;
    newPrimaryAxis += dot(primaryAxis, point) * point;
    newSecondaryAxis += dot(secondaryAxis, point) * point;
  }
  primaryAxis = newPrimaryAxis.normalized;
  secondaryAxis = projectOnPlane(newSecondaryAxis, 
                                 primaryAxis).normalized;
}
normal = cross(primaryAxis, secondaryAxis).normalized;
```
<script type="text/javascript" src="../../assets/js/LineFitting/PlaneFitting.js" orbit="enabled" residuals="enabled"></script>

From here, it is trivial to see how one might add _additional_ secondary axes of fit.  There might come a point when numerical instability will prevent the lower-order axes from fitting nicely with this speedup.  If that happens, I recommend just projecting your points down to the plane after solving each axis.

I hope these techniques will come in handy whenever someone wants to fit lines or planes without incurring large dependencies within their projects.