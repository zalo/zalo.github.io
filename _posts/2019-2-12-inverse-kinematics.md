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

My favorite way of doing Inverse Kinematics is called "Quaternion Cyclic Coordinate Descent" or "CCDIK":

<!-- Load the Three.js library, assorted helpers, and the actual IK script code... -->
<script type="text/javascript" src="../../assets/js/three.js"></script>
<script type="text/javascript" src="../../assets/js/DragControls.js"></script>
<script type="text/javascript" src="../../assets/js/OrbitControls.js"></script>
<script type="text/javascript" src="../../assets/js/IK/Environment.js"></script>
<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="enabled"  limits="enabled"></script>

### CCDIK

At its core, the algorithm is very simple:
```
foreach joint in joints {
  // Point the effector towards the goal
  directionToEffector = effector.position - joint.position;
  directionToGoal = goal.position - joint.position;
  joint.rotateFromTo(directionToEffector, directionToGoal);
}
```

At each joint, we're just telling the joint to point the end effector towards the goal position.

<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="disabled" limits="disabled"></script>

Of course, if it reaches for the goal without regard for the hinges, it looks unnatural!

### Hinges

We can take the hinges into account by enforcing the hinge-axis after the CCD step:
```
foreach joint in joints {
  // Point the effector towards the goal (See Above)

  // Constrain to rotate about the axis
  curHingeAxis = joint.rotation * joint.axis;
  hingeAxis = joint.parent.rotation * joint.axis;
  joint.rotateFromTo(curHingeAxis, hingeAxis);
}
```
<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="enabled"  limits="disabled"></script>

This is beginning to look pretty good, but real joints often have limits.  

### Limits

You can apply limits in local-euler angle space:
```
foreach joint in joints {
  // Point the effector towards the goal (See Above)
  // Constrain to rotate about the axis (See Above)

  // Enforce Joint Limits
  joint.localRotation.clampEuler(joint.minLimit, joint.maxLimit);
}
```
<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="enabled" limits="enabled" orbit="enabled"></script>

This final aspect gives you an iterative 3D IK algorithm that beats every other Inverse Kinematics algorithm out there.


### Properties of Various IK Algorithms
|              IK Algorithms |      Analytic     | Automatic Differentiation | Jacobian Transpose |       FABRIK      |           Quaternion CCDIK           |
|---------------------------:|:-----------------:|:-------------------------:|:------------------:|:-----------------:|:------------------------------------:|
| Implementation Complexity? | Extremely Complex |            Hard           |        Hard        |        Easy       |                 Easy                 |
|                      Speed |   Extremely Fast  |      Slow To Converge     |  Slow To Converge  |        Fast       |                 Fast                 |
|              Hinges Joints |    Only Hinges?   |            Yes            |         Yes        |        No!        |                  Yes                 |
|               Joint Limits |     Difficult     |            Yes            |         No         |   Conical Limits  |                  Yes                 |
|         Hits Singularities |       Never       |           Often           |        Often       |       Never       | Rarely (often anneals  through them) |
|      Convergence Behaviour |      Instant      |           Stable          |       Stable       | Very Well Behaved |  Well Behaved across short distances |
|           Number of Joints |       Max ~5      |         Arbitrary         |      Arbitrary     |     Arbitrary     |               Arbitrary              |