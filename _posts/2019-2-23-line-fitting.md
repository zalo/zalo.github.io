---
title: "Orthogonal Regression"
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

Because of this, however, it has no analytic solution*.  There are a variety of iterative solutions available, but they often depend on an operation called the **Singular Value Decomposition** or **SVD**.  SVDs are a complex matrix decomposition that are usually only found in heavy-weight matrix libraries.  Avoiding the inlusion of these libraries is the motivation for the technique outlined in this post.

### The Centroid

The first key insight is that the orthogonal regression line will always pass through the average (or _centroid_) of the points.

The centroid can be computed by adding the points together, and then dividing by the number of points.
```
centroid = Vector3(0,0,0);
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
nextDirection = Vector3(0, 0, 0);
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
(* There might be an analytic solution [with quaternions](https://en.wikipedia.org/wiki/Deming_regression#Orthogonal_regression), but I have not been able to get this technique to work out-of-plane; it appears to work only when all the points lie in the same plane (where as the technique presented above works in any number of dimensions).  [The Unity code I've been using to test quaternion-based fitting is here](https://github.com/zalo/MathUtilities/blob/master/Assets/LeastSquares/LeastSquaresFitting.cs#L163-L179) )
</small>

<small>
(** The observant among you will notice that there exists starting angles where the progress towards the true fitting line is **0**.  This is actually a singularity, where the starting guess is perfectly orthogonal to the true answer.   It's difficult to hit this in practice, but it can be useful to include explicit checks to combat this behaviour.  What's interesting is that one can abuse this singularity to save on the computation of down projecting the data when fitting secondary principal component axes.  This even allows one to fit all of the principal component axes simultaneously. )
</small>