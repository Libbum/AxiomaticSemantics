+++
title = "Clustering Tangent Spheres"
description = "Make yourself a little nest of eggs. Where your eggs are perfectly round and magically float in free space."
tags = ["Geometry"]
date = 2018-01-16
aliases = ["/posts/2018-01-16-clustering-tangent-spheres.html"]
[extra]
katex = true
banner = "bubbles"
+++

So you want to do some sphere packing to make your inflatable [space habitats](https://github.com/Libbum/space-habitats) for deployment on the Moon and Mars snug and cozy.
Perfectly straightforward you think to yourself; since one can start with a triplet of spheres tangent pairwise by placing one at some origin on a 2D plane, extending the second out in the \\(x\\) direction and completing the triangle by identifying the third sphere's position based on the radii of all three.

<figure>
<img src="/images/triplet_diagram.svg" alt="A sphere triplet" width="700px" />
<figcaption>An initial sphere triplet located on the vertices of a triangle with side lengths constructed from sphere radii: \(a=r_B+r_C, b=r_A+r_C, c=r_A+r_B\)</figcaption>
</figure>

<!-- more -->
There's not even time to take a mirco-break to refresh your favourite time sink website before you've busted out the coordinates of \\(C\\)

$$e = \frac{b^2+c^2-a^2}{2c}, \quad f= \sqrt{b^2-e^2}.$$

On a roll, you extend the coordinates of \\(A\\), \\(B\\) and \\(C\\) into three dimensions setting their \\(z\\) component to \\(0\\) and construct a tetrahedron from this base triangle and three new distances \\(m = r_A+r_D\\), \\(n = r_B+r_D\\), \\(p=r_C+r_D\\); finding the tetrahedron's fourth vertex

$$x_D = \frac{m^2+c^2-n^2}{2c}, \quad y_D = \frac{f^2c+m^2c-m^2e+n^2e-p^2c-c^2e+e^2c}{2fc}, \quad z_D = \pm\sqrt{m^2-x_D^2-y_D^2}.$$

Pausing for just a moment, you realise you've been on autopilot for a second&mdash;since such trivial calculations are self evident.
Reflecting on a time that feels so long ago now, when you learnt that a minimal set of four tangent spheres in three dimensions can be described by a tetrahedron.
The locus of each sphere's center point is one of the tetrahedron's vertices, and the lengths of each edge of the tetrahedron are defined via the radii of the pair of spheres for which the edge connects their centers.
Using the already-known properties of the base triangle; introducing a fourth sphere \\(D\\) with known radius \\(r_D\\) and finding its coordinates, is now just some basic geometry&mdash;extending the system of equations used to solve the locus of \\(C\\)

$$\begin{aligned}
e^2+f^2&=b^2\\\\
(e-c)^2+f^2&=a^2,\\\\
\end{aligned}$$

to the intersection represented by
$$\begin{aligned}
x_D^2+y_D^2+z_D^2&=m^2\\\\
(x_D-c)^2+y_D^2+z_D^2&=n^2\\\\
(x_D-e)^2+(y_D-f)^2+z_D^2&=p^2.\\\\
\end{aligned}$$

Back from your daydream&mdash;that time sink website is calling.
Since you've pretty much wrapped this problem up, why not take a peek?
After a few sensible chuckles, it dawns on you that there's still work to do.
Your sphere packing algorithm is going to feed you positions and radii of arbitrary sets of pairwise tangent triplets for you to calculate the fourth position.
This means that if you are solving the tetrahedron in this simple basis, translation and rotation of \\(D\\)'s position must occur.

Moreover, this is going to have to happen in a number of steps.

1. Remove \\(\triangle ABC\\)'s translation component, aligning \\(A\\) to the origin.
2. Recalculate \\(c, e, f\\) in the simple basis for this triplet to solve for the fourth locus.
3. Denote the solution as \\(H\\) in tetrahedron \\(EFGH\\), which now must be translated to tetrahedron \\(ABCD\\)'s basis to find \\(D\\).
4. Rotate \\(\overrightarrow{EF}\\) onto \\(\overrightarrow{AB}\\).
5. Rotate \\(G\\) to \\(C\\) by rotating the face normals of the triangle identified in 4 and \\(\triangle ABC\\).
6. Translate this triangle to the \\(ABC\\) basis by returning the translation component removed in 1.

None of this is too difficult in of its own, but without proper forethought&mdash;you're gonna have a bad time.
Basically you're going to end up catching edge cases just to the left of center like a tennis ball to the nuts of a daydreaming ball boy at the US Open.

What happens when you're sent a triplet that has coordinates (in the translated basis) \\((0,0,0)\\), \\((e,f,0)\\), \\((c,0,0)\\) or in other words: when \\(B=G\\) and \\(C=F\\)?
You must check for this mirror symmetry to make sure that the first rotation doesn't place your \\(F\\) position closer to Alpha Centauri than it does to it's wanted position at \\(B\\).

The list goes on, but it suffices to say that you start juggling possibilities like some guy trying to wash a car in an infomercial.

Fret not! There is a better way!

---

Consider that we have a pairwise tangent triplet with known radii and arbitrary positions in \\(\mathbb{R}^3\\).
Additionally, we know the radius of a fourth sphere we wish to add to the cluster.

To not confuse the skimming reader&mdash;I will change notations here, and define a tetrahedron with vertices \\(S_1\\), \\(S_2\\) and \\(S_3\\) residing at distances \\(d_1\\), \\(d_2\\), \\(d_3\\) from a fourth vertex \\(S_0\\), whose coordinates \\((x,y,z)\\) must be found.

The distance values here are straightforward, since they are defined as the sum of the radii along a given edge: \\(d_i=r_i+r_0\\).
Since \\(S_0\\) is at the intersection of three spheres centered at \\(S_1\\), \\(S_2\\), \\(S_3\\) with radii \\(d_1\\), \\(d_2\\), \\(d_3\\), we know its coordinates satisfy the equations

$$\begin{aligned}
(x-x_1)^2+(y-y_1)^2+(z-z_1)^2&=d_1^2\qquad(1)\\\\
(x-x_2)^2+(y-y_2)^2+(z-z_2)^2&=d_2^2\qquad(2)\\\\
(x-x_3)^2+(y-y_3)^2+(z-z_3)^2&=d_3^2\qquad(3)\\\\
\end{aligned}$$

Subtract (1) from (2) & (3) to obtain the equations for two planes, and couple this set with (1) to yield the quadratic system:

$$\begin{aligned}
2(x_1-x_2)x+2(y_1-y_2)y+2(z_1-z_2)z&=d_2^2-d_1^2+x_1^2-x_2^2+y_1^2-y_2^2+z_1^2-z_2^2\\\\
2(x_1-x_3)x+2(y_1-y_3)y+2(z_1-z_3)z&=d_3^2-d_1^2+x_1^2-x_3^2+y_1^2-y_3^2+z_1^2-z_3^2\\\\
x^2+y^2+z^2-2 x_1 x-2 y_1 y-2 z_1 z &= d_1^2-x_1^2-y_1^2-z_1^2.\\\\
\end{aligned}$$

The closed form solution to this system is not the nicest of expressions, so we can consider the equivalent set below in vector format
$$
\begin{aligned}
\vec u\cdot\vec r=a\\\\
\vec v\cdot\vec r=b\\\\
\vec r\cdot\vec r+\vec w\cdot\vec r=c\\\\
\end{aligned}
$$
where \\(\vec r=(x,y,z)\\) is our unknown vector.
Following from this, we obtain values of most of the components directly,

$$\begin{aligned}
\vec u&=\frac{S_1-S_2}{\left\|S_1-S_2\right\|}\\\\
\vec v&=\frac{S_1-S_3}{\left\|S_1-S_3\right\|}\\\\
\vec w&=-2S_1\\\\
a&=\frac{d_2^2-d_1^2+x_1^2-x_2^2+y_1^2-y_2^2+z_1^2-z_2^2}{2\left\|S_1-S_2\right\|}\\\\
b&=\frac{d_3^2-d_1^2+x_1^2-x_3^2+y_1^2-y_3^2+z_1^2-z_3^2}{2\left\|S_1-S_3\right\|}\\\\
c&=d_1^2-x_1^2-y_1^2-z_1^2\\\\
\end{aligned}$$

Notice that \\(\vec u\\) and \\(\vec v\\) are unit vectors, so we can form a basis with a third vector:

$$\vec t=\frac{\vec u\times\vec v}{\left\|\vec u\times\vec v\right\|}.$$

A solution to \\(\vec r\\) can then be obtained in the form \\(\vec r=\alpha\vec u+\beta\vec v+\gamma\vec t\\) once \\(\alpha\\), \\(\beta\\) and \\(\gamma\\) are identified.
Plugging this expression for \\(\vec r\\) into the vector equations for \\(a\\) and \\(b\\) above immediately yields

$$\alpha=\frac{a-b(\vec u\cdot\vec v)}{1-(\vec u\cdot\vec v)^2},\quad\beta=\frac{b-a(\vec u\cdot\vec v)}{1-(\vec u\cdot\vec v)^2},$$

while the third equation becomes \\(\gamma^2+(\vec w\cdot\vec t)\gamma+d=0\\) where \\(d=\alpha^2+\beta^2+2\alpha\beta(\vec u\cdot\vec v)+\alpha(\vec u\cdot\vec w)+\beta(\vec v\cdot\vec w)-c\\).

This last equation can finally be solved for \\(\gamma\\):

$$\gamma=\frac{1}{2}\left(-(\vec w\cdot\vec t)\pm\sqrt{(\vec w\cdot\vec t)^2-4d}\right).$$

With these values you can now solve the irregular tetrahedron in 3D directly!
This means no edge cases, no recalculation of previously known values or complex `if elseif else` blocks based on various input conditions.

{{ figure(src="spherecluster.png", caption="The fruits of your labour made manifest.") }}
