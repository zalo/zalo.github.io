---
title: "Inverse Kinematics"
date: 2019-2-16 16:10:33 -0000
categories: blog
tags:
  - Inverse
  - Kinematics
  - IK
toc: true
---

Inverse Kinematics is the process of finding a set of joint angles that reach a goal position.

My favorite way of doing Inverse Kinematics is called ["Quaternion Cyclic Coordinate Descent"](http://number-none.com/product/IK%20with%20Quaternion%20Joint%20Limits/) or "CCDIK":

<!-- Hide the Table of Contents (but keep the navigation :^) ... -->
<script type="text/javascript">
  document.getElementsByClassName('toc')[0].style.display = 'none';
</script>

<!-- Load the Three.js library, assorted helpers, and the actual IK script code... -->
<script type="text/javascript" src="../../assets/js/three.js"></script>
<script type="text/javascript" src="../../assets/js/DragControls.js"></script>
<script type="text/javascript" src="../../assets/js/OrbitControls.js"></script>
<script type="text/javascript" src="../../assets/js/IK/Environment.js"></script>
<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="enabled"  limits="enabled"></script>

### CCDIK

At its core, the algorithm is very simple
```
foreach joint in jointsTipToBase {
  // Point the effector towards the goal
  directionToEffector = effector.position - joint.position;
  directionToGoal = goal.position - joint.position;
  joint.rotateFromTo(directionToEffector, directionToGoal);
}
```

We're just telling each joint to _point the end effector_ towards the goal position.

<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="disabled" limits="disabled"></script>

Of course, if it reaches for the goal without regard for the hinges, it looks unnatural!

### Hinges

We can take the hinges into account by enforcing the hinge-axis after the CCD step
```
foreach joint in jointsTipToBase {
  // Point the effector towards the goal (See Above)

  // Constrain to rotate about the axis
  curHingeAxis = joint.rotation * joint.axis;
  hingeAxis = joint.parent.rotation * joint.axis;
  joint.rotateFromTo(curHingeAxis, hingeAxis);
}
```
<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="enabled"  limits="disabled"></script>

Even at one iteration per frame, this is beginning to look pretty good! But real joints often have limits...

### Limits

You can apply axis-aligned hinge limits in local-euler angle space
```
foreach joint in jointsTipToBase {
  // Point the effector towards the goal (See Above)
  // Constrain to rotate about the axis (See Above)

  // Enforce Joint Limits
  joint.localRotation.clampEuler(joint.minLimit, joint.maxLimit);
}
```
<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="enabled" limits="enabled" orbit="enabled"></script>
<small>[Full Source](https://github.com/zalo/zalo.github.io/blob/master/assets/js/IK/IKExample.js)</small>

This final aspect gives you an iterative 3D IK algorithm that beats nearly every other Heuristic Inverse Kinematics algorithm out there.


### Properties of Various IK Algorithms

| IK Algorithms              | Analytic          | Automatic Differentiation | Jacobian Transpose | FABRIK              | Quaternion CCDIK                     |
|----------------------------|-------------------|---------------------------|--------------------|---------------------|--------------------------------------|
| Implementation Complexity? | Extremely Complex | Hard                      | Hard               | Easy                | Easy                                 |
| Speed                      | Extremely Fast    | Slow To Converge          | Slow To Converge   | Fast                | Fast                                 |
| Hinge Joints               | Only Hinges?      | Yes                       | Yes                | No!                 | Yes                                  |
| Joint Limits               | Difficult         | Yes                       | No                 | Conical Limits      | Yes                                  |
| Hits Singularities         | Never             | Often                     | Often              | Never (w/out hinges)| Rarely (often anneals through them) |
| Convergence Behaviour      | Instant           | Stable                    | Stable             | Very Well Behaved   | Well Behaved across short distances  |
| Number of Joints           | Max ~5            | Arbitrary                 | Arbitrary          | Arbitrary           | Arbitrary                            |

### Bonus: Direction

The astute among you might notice that this is a 5-DoF arm.  This means it is over-actuated for just touching a 3-DoF point.

With 5-Dof, you can hypothetically touch any point _from any direction_.

```
foreach joint in jointsTipToBase {
  if(joint.id > 3)
    // Point the effector along the desired direction
    joint.rotateFromTo(effector.direction, goal.direction);
  } else {
    // Point the effector towards the goal (See Above)
  }
  // Constrain to rotate about the axis (See Above)
  // Enforce Joint Limits (See Above)
}
```
<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="enabled" limits="enabled" orbit="enabled" matchDirection="enabled"></script>

Now that the system is only "sufficiently actuated" (where the IK is using each degree of freedom the arm possesses), you may notice that it hits joint-limit based singularities more often.   

These concavities are impossible to avoid in a heuristic IK algorithm (read: all of them except `Analytic`).  However, it is possible to "jump out of" concavities by adding large random offsets to each joint, and then attempting the IK solve again.   This is known as ["Simulated Annealing"](https://en.wikipedia.org/wiki/Simulated_annealing).  Implementing this is left as an exercise to the reader.

<div class="togglebox">
  <input id="toggle1Long" type="checkbox" name="toggle" />
  <label for="toggle1Long">Click for Appendix: Rotation from Two Vectors</label>
  <section id="content1Long" markdown="1" >
While 3D Engines ([Unity](https://docs.unity3d.com/ScriptReference/Quaternion.FromToRotation.html), [Three.js](https://threejs.org/docs/#api/en/math/Quaternion.setFromUnitVectors)) come with this function, it can be useful to see how it is implemented.

[Sam](http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors) [Hocevar](http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final), [Inigo Quilez](https://iquilezles.org/www/articles/noacos/noacos.htm), [Jonathon Blow](http://number-none.com/product/IK%20with%20Quaternion%20Joint%20Limits/), and [Marc B. Reynolds](http://marc-b-reynolds.github.io/quaternions/2016/08/09/TwoNormToRot.html) all give excellent implementations and derivations.

For convenience, this is a mirror of Sam Hocevar's robust C++ implementation:
~~~ c++
quat quat::fromtwovectors(vec3 u, vec3 v) {
    float norm_u_norm_v = sqrt(dot(u, u) * dot(v, v));
    float real_part = norm_u_norm_v + dot(u, v);
    vec3 w;

    if (real_part < 1.e-6f * norm_u_norm_v) {
        /* If u and v are exactly opposite, rotate 180 degrees
         * around an arbitrary orthogonal axis. Axis normalisation
         * can happen later, when we normalise the quaternion. */
        real_part = 0.0f;
        w = abs(u.x) > abs(u.z) ? vec3(-u.y, u.x, 0.f)
                                : vec3(0.f, -u.z, u.y);
    } else {
        /* Otherwise, build quaternion the standard way. */
        w = cross(u, v);
    }

    return normalize(quat(real_part, w.x, w.y, w.z));
}
~~~

and Marc's Simple C++ implementation:
~~~ c++
vec4 q_from_normals(vec3 a, vec3 b) {
  float k = 1.0+dot(a,b);         // 1+d
  float s = inversesqrt(k+k);     // 1/sqrt(2+2d)
  return vec4(s*cross(a,b), k*s); // (1+d)/sqrt(2+2d) + (a x b)/sqrt(2+2d)
}
~~~
  </section>
</div>
