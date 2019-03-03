---
title: "Closest Points between Line Segments in 3D"
date: 2019-3-2 20:10:33 -0000
categories: blog
tags:
  - Lines
  - Line Segments
  - Closest Point
toc: true
---

One of my favorite functions projects points onto line segments.

<!-- Hide the Table of Contents (but keep the navigation :^) ... -->
<script type="text/javascript">
  document.getElementsByClassName('toc')[0].style.display = 'none';
</script>
<!-- Load the Three.js library, assorted helpers, and the actual line fitting script code... -->
<script type="text/javascript" src="../../assets/js/three.js"></script>
<script type="text/javascript" src="../../assets/js/DragControls.js"></script>
<script type="text/javascript" src="../../assets/js/OrbitControls.js"></script>
<script type="text/javascript" src="../../assets/js/IK/Environment.js"></script>
<script type="text/javascript" src="../../assets/js/ClosestSegment/ClosestSegment.js" orbit="enabled"></script>
```
function constrainToSegment(position, a, b) {
    ba = b - a; t = Dot(position - a, ba) / Dot(ba, ba);
    return Lerp(a, b, Clamp01(t));
}
```

It’s just so simple, fast, and useful! It works using the dot product to do vector projection.

But did you know that you can extend this trick to find the closest point between two line segments?

### Line Segments

<script type="text/javascript" src="../../assets/js/ClosestSegment/SegmentSegment.js" orbit="enabled"></script>

The key is to recognize that you can turn the pair of line segments INTO a point and a line segment by squishing all four points onto the plane defined by the first line segment!

<script type="text/javascript" src="../../assets/js/ClosestSegment/SegmentSegment.js" orbit="enabled" debug="enabled"></script>
```
inPlaneA = segA.projectToPlane(segC, segD - segC);
inPlaneB = segB.projectToPlane(segC, segD - segC);
inPlaneBA = inPlaneB - inPlaneA;
t = Dot(segC - inPlaneA, inPlaneBA) / Dot(inPlaneBA, inPlaneBA) ;
t = (inPlaneA != inPlaneB) ? t : 0f; // Zero's t if parallel
segABtoLineCD = Lerp(segA, segB, Clamp01(t));

segCDtoSegAB = constrainToSegment(segABtoLineCD, segC, segD);
segABtoSegCD = constrainToSegment(segCDtoSegAB, segA, segB);
```

Solving for the closest point in this reduced sub space gives you an answer that is valid in the full space!

### Optimization

You can also do this function entirely without square roots in its optimized form:
```
segDC = segD - segC; float lineDirSqrMag = Dot(segDC, segDC);
inPlaneA = segA-((Dot(segA-segC, segDC)/lineDirSqrMag)*segDC);
inPlaneB = segB-((Dot(segB-segC, segDC)/lineDirSqrMag)*segDC);
inPlaneBA = inPlaneB - inPlaneA;
t = Dot(segC - inPlaneA, inPlaneBA) / Dot(inPlaneBA, inPlaneBA) ;
t = (inPlaneA != inPlaneB) ? t : 0f; // Zero's t if parallel
segABtoLineCD = Lerp(segA, segB, Clamp01(t));

segCDtoSegAB = constrainToSegment(segABtoLineCD, segC, segD);
segABtoSegCD = constrainToSegment(segCDtoSegAB, segA, segB);
```
The only branch checks if the lines are parallel (which is unlikely on real-world data).