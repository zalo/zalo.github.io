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
foreach joint in joints {
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
foreach joint in joints {
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

You can apply limits in local-euler angle space
```
foreach joint in joints {
  // Point the effector towards the goal (See Above)
  // Constrain to rotate about the axis (See Above)

  // Enforce Joint Limits
  joint.localRotation.clampEuler(joint.minLimit, joint.maxLimit);
}
```
<script type="text/javascript" src="../../assets/js/IK/IKExample.js" ccd="enabled" hinge="enabled" limits="enabled" orbit="enabled"></script>

This final aspect gives you an iterative 3D IK algorithm that beats nearly every other Heuristic Inverse Kinematics algorithm out there.


### Properties of Various IK Algorithms

| IK Algorithms              | Analytic          | Automatic Differentiation | Jacobian Transpose | FABRIK              | Quaternion CCDIK                     |
|----------------------------|-------------------|---------------------------|--------------------|---------------------|--------------------------------------|
| Implementation Complexity? | Extremely Complex | Hard                      | Hard               | Easy                | Easy                                 |
| Speed                      | Extremely Fast    | Slow To Converge          | Slow To Converge   | Fast                | Fast                                 |
| Hinges Joints              | Only Hinges?      | Yes                       | Yes                | No!                 | Yes                                  |
| Joint Limits               | Difficult         | Yes                       | No                 | Conical Limits      | Yes                                  |
| Hits Singularities         | Never             | Often                     | Often              | Never (w/out hinges)| Rarely (often anneals through them) |
| Convergence Behaviour      | Instant           | Stable                    | Stable             | Very Well Behaved   | Well Behaved across short distances  |
| Number of Joints           | Max ~5            | Arbitrary                 | Arbitrary          | Arbitrary           | Arbitrary                            |

### Bonus: Direction

The astute among you might notice that this is a 5-DoF arm.  This means it is over-actuated for just touching a 3-DoF point.

With 5-Dof, you can hypothetically touch any point _from any direction_.

```
foreach joint in joints {
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

Now that the system is only "sufficiently actuated" (where the IK is using each degree of freedom the arm possesses), you'll notice that it hits joint-limit based singularities more often.   

These concavities are impossible to avoid in a heuristic IK algorithm (read: all of them except `Analytic`).  However, it is possible for to "jump out of" concavities by adding large random offsets to each joint, and then attempting the IK solve again.   This is known as ["Simulated Annealing"](https://en.wikipedia.org/wiki/Simulated_annealing).  Implementing this is left as an exercise to the reader.