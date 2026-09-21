#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

// Fresnel
uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform vec3 u_CameraPos;
uniform float u_FresnelBias;
uniform float u_FresnelScale;
uniform float u_FresnelPower;
uniform float u_FresnelThreshold;
uniform float u_Time;

// Perlin noise

// Perlin animation
uniform float u_PerlinSpeedX;
uniform float u_PerlinSpeedY;
uniform float u_PerlinScaleX;
uniform float u_PerlinScaleY;
uniform float u_PerlinThreshold;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec3 fs_WorldPos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

// Colors
uniform vec4 u_FireYellow;
uniform vec4 u_FireRed;
uniform vec4 u_FireOrange;

// Fresnel Mask =======================================================================
float FresnelMask(vec3 viewDir, vec3 normal, float bias, float scale, float power) {
    float normalDotView = clamp(dot(normalize(viewDir), normalize(normal)), 0.0, 1.0);
    float result = bias + scale * pow(1.0 - normalDotView, power);
    return clamp(result, 0.0, 1.0);
}
// =====================================================================================

// Perlin Noise ========================================================================
// Return a deterministic pseudo-random gradient for an integer lattice point.
vec3 gradientHash(vec3 latticePoint)
{
    vec3 hashInput = vec3(
        dot(latticePoint, vec3(127.1, 311.7, 74.7)),
        dot(latticePoint, vec3(269.5, 183.3, 246.1)),
        dot(latticePoint, vec3(113.5, 271.9, 124.6))
    );

    vec3 gradient = -1.0 + 2.0 * fract(sin(hashInput) * 43758.5453123);
    return normalize(gradient);
}

// Quintic fade curve with zero first derivative at both cell boundaries.
vec3 perlinFade(vec3 t)
{
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Sample continuous 3D gradient noise and remap the result to [0, 1].
float perlinNoise(vec3 samplePosition)
{
    vec3 cell = floor(samplePosition);
    vec3 localPosition = fract(samplePosition);
    vec3 blend = perlinFade(localPosition);

    float n000 = dot(gradientHash(cell + vec3(0.0, 0.0, 0.0)), localPosition - vec3(0.0, 0.0, 0.0));
    float n100 = dot(gradientHash(cell + vec3(1.0, 0.0, 0.0)), localPosition - vec3(1.0, 0.0, 0.0));
    float n010 = dot(gradientHash(cell + vec3(0.0, 1.0, 0.0)), localPosition - vec3(0.0, 1.0, 0.0));
    float n110 = dot(gradientHash(cell + vec3(1.0, 1.0, 0.0)), localPosition - vec3(1.0, 1.0, 0.0));
    float n001 = dot(gradientHash(cell + vec3(0.0, 0.0, 1.0)), localPosition - vec3(0.0, 0.0, 1.0));
    float n101 = dot(gradientHash(cell + vec3(1.0, 0.0, 1.0)), localPosition - vec3(1.0, 0.0, 1.0));
    float n011 = dot(gradientHash(cell + vec3(0.0, 1.0, 1.0)), localPosition - vec3(0.0, 1.0, 1.0));
    float n111 = dot(gradientHash(cell + vec3(1.0, 1.0, 1.0)), localPosition - vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, blend.x);
    float nx10 = mix(n010, n110, blend.x);
    float nx01 = mix(n001, n101, blend.x);
    float nx11 = mix(n011, n111, blend.x);
    float nxy0 = mix(nx00, nx10, blend.y);
    float nxy1 = mix(nx01, nx11, blend.y);
    float rawNoise = mix(nxy0, nxy1, blend.z);

    return clamp(rawNoise * 0.5 + 0.5, 0.0, 1.0);
}
// =====================================================================================

// Perlin Mask =========================================================================
float fireMask(float inputVal, float threshold) {
    if (inputVal < threshold) {
        return 1.0;
    } else {
        return 0.0;
    }
}

// ======================================================================================

void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = u_FireRed; // Use the fire red color as the base color for the fireball

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Fresnel Mask
        float fresnel = FresnelMask(
            normalize(u_CameraPos - fs_WorldPos),
            normalize(fs_Nor.xyz),
            u_FresnelBias,
            u_FresnelScale,
            u_FresnelPower
        );

        // Animate the procedural Perlin sample along X or Y.
        vec3 perlinSamplePosition = fs_WorldPos;
        perlinSamplePosition.xy *= vec2(u_PerlinScaleX, u_PerlinScaleY);
        perlinSamplePosition.xy += vec2(u_PerlinSpeedX, u_PerlinSpeedY) * u_Time;
        float perlinValue = perlinNoise(perlinSamplePosition);

        // Final Color Calculation
        float stripeMask =
            fireMask(perlinValue, u_PerlinThreshold);

        float fireFresnelMask = step(u_FresnelThreshold, fresnel);
        fresnel *= fireFresnelMask;

        float inverseStripeMask = 1.0 - fresnel;

        vec3 fireBallColor =
            diffuseColor.rgb
            * fresnel;

        vec3 fireBallInnerColor =
            u_FireOrange.rgb
            * inverseStripeMask;

        fireBallColor += fireBallInnerColor;

        vec3 finalColor = mix(
            fireBallColor,
            u_FireYellow.rgb,
            stripeMask
        );

        out_Col = vec4(
            finalColor,
            diffuseColor.a
        );
}
