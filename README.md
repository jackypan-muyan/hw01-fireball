# HW 1: WebGL Fireball

This project creates an animated WebGL fireball by combining several procedural masks across multiple rendering layers. The masks control both vertex displacement and fragment color, allowing the head and tail of the fireball to share a consistent shape while using different visual effects.

## 1. Fireball Core

The core fireball uses two Fresnel masks to create three distinct color regions. One Fresnel mask separates the red and orange areas by using both the mask and its inverse. A second, inverted Fresnel mask defines the bright yellow center.

I used piecewise thresholds to keep the color boundaries distinct. This approach avoids creating three duplicate icospheres for the core colors and allows them to share the same vertex transformation.

## 2. Ash and Tornado

The ash effect is based on Voronoi noise. Voronoi noise normally produces a cell-like pattern with strong edges, so I invert it to create scattered, ash-like pieces.

The tornado uses the same general pattern with a larger horizontal scale and a faster animation speed, which stretches the pieces into a more directional flow.

## 3. Fire Shell

The fire shell is rendered on a second icosphere. It uses thresholded Perlin noise as a mask, discarding fragments outside the selected ranges to form an uneven outer shell.

The shell contains two threshold-based color layers: a yellow layer and a white-hot layer.

## 4. Fire Tail and Vertex Transformation

The base vertex transformation combines a sine wave for large-scale motion with fractal Brownian motion (fBM) for smaller surface distortion.

The fire tail is defined using a back vector and a Gaussian mask. The dot product between each vertex direction and the back vector determines how closely the vertex aligns with the tail. The Gaussian mask then creates a gradual falloff, which is used to increase the displacement and fBM intensity near the tail.

This same mask is passed to the fragment shaders so the surface effects can respond consistently to the head and tail regions. An inverted version of the fire-shell mask also helps connect the shell and tail without an obvious seam.

## 5. Gas Shell

The outer gas shell is rendered on another icosphere. A sine wave in the fragment shader controls its visible pattern, while negative values are discarded. The shell also uses the inverse Gaussian tail mask to fade its opacity toward the tail.

## Shared Shader Structure

All icospheres use the same vertex shader to keep their deformations consistent. The masks calculated in the vertex shader are passed to the fragment shaders, where each rendering layer uses them to control color, visibility, or opacity. Therefore the tail and ball shader were in the same fragment shader.
