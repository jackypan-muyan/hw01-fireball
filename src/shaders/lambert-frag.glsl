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
uniform float u_CenterFresnelBias;
uniform float u_CenterFresnelScale;
uniform float u_CenterFresnelPower;
uniform float u_CenterFresnelThreshold;
uniform float u_Time;
uniform float u_PerlinSpeedX;
uniform float u_PerlinSpeedY;
uniform float u_PerlinScaleX;
uniform float u_PerlinScaleY;
uniform float u_PerlinThreshold;
uniform float u_FireTextureTesselation;
uniform float u_VoronoiSpeedX;
uniform float u_VoronoiSpeedY;
uniform float u_VoronoiScaleX;
uniform float u_VoronoiScaleY;
uniform float u_VoronoiEdgeWidth;
uniform float u_TornadoSpeedX;
uniform float u_TornadoSpeedY;
uniform float u_TornadoScaleX;
uniform float u_TornadoScaleY;
uniform float u_TornadoEdgeWidth;
uniform float u_TornadoThreshold;

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
uniform vec4 u_FresnelCenterColor;
uniform vec4 u_AshColor;
uniform float u_AshThreshold;
uniform vec4 u_TornadoColor;

// Fresnel Mask =======================================================================
float FresnelMask(vec3 viewDir, vec3 normal, float bias, float scale, float power) {
    float normalDotView = clamp(dot(normalize(viewDir), normalize(normal)), 0.0, 1.0);
    float result = bias + scale * pow(1.0 - normalDotView, power);
    return clamp(result, 0.0, 1.0);
}
// =====================================================================================

// Perlin Noise ========================================================================
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

vec3 perlinFade(vec3 t)
{
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

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

float piecewiseLinearPerlin(vec3 samplePosition, float tesselation)
{
    float gridResolution = max(floor(tesselation), 1.0);
    vec3 gridPosition = samplePosition * gridResolution;
    vec3 cell = floor(gridPosition);
    vec3 localPosition = fract(gridPosition);

    vec3 firstOffset;
    vec3 secondOffset;
    float largest;
    float middle;
    float smallest;

    if (localPosition.x >= localPosition.y) {
        if (localPosition.y >= localPosition.z) {
            firstOffset = vec3(1.0, 0.0, 0.0);
            secondOffset = vec3(1.0, 1.0, 0.0);
            largest = localPosition.x;
            middle = localPosition.y;
            smallest = localPosition.z;
        } else if (localPosition.x >= localPosition.z) {
            firstOffset = vec3(1.0, 0.0, 0.0);
            secondOffset = vec3(1.0, 0.0, 1.0);
            largest = localPosition.x;
            middle = localPosition.z;
            smallest = localPosition.y;
        } else {
            firstOffset = vec3(0.0, 0.0, 1.0);
            secondOffset = vec3(1.0, 0.0, 1.0);
            largest = localPosition.z;
            middle = localPosition.x;
            smallest = localPosition.y;
        }
    } else {
        if (localPosition.x >= localPosition.z) {
            firstOffset = vec3(0.0, 1.0, 0.0);
            secondOffset = vec3(1.0, 1.0, 0.0);
            largest = localPosition.y;
            middle = localPosition.x;
            smallest = localPosition.z;
        } else if (localPosition.y >= localPosition.z) {
            firstOffset = vec3(0.0, 1.0, 0.0);
            secondOffset = vec3(0.0, 1.0, 1.0);
            largest = localPosition.y;
            middle = localPosition.z;
            smallest = localPosition.x;
        } else {
            firstOffset = vec3(0.0, 0.0, 1.0);
            secondOffset = vec3(0.0, 1.0, 1.0);
            largest = localPosition.z;
            middle = localPosition.y;
            smallest = localPosition.x;
        }
    }

    const vec3 sampleOffset = vec3(0.37, 0.61, 0.83);
    float value0 = perlinNoise(cell / gridResolution + sampleOffset);
    float value1 = perlinNoise((cell + firstOffset) / gridResolution + sampleOffset);
    float value2 = perlinNoise((cell + secondOffset) / gridResolution + sampleOffset);
    float value3 = perlinNoise((cell + vec3(1.0)) / gridResolution + sampleOffset);

    return
        (1.0 - largest) * value0
        + (largest - middle) * value1
        + (middle - smallest) * value2
        + smallest * value3;
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

// Voronoi Noise ======================================================================================
vec3 voronoiHash(vec3 cell)
{
    vec3 hashInput = vec3(
        dot(cell, vec3(127.1, 311.7, 74.7)),
        dot(cell, vec3(269.5, 183.3, 246.1)),
        dot(cell, vec3(113.5, 271.9, 124.6))
    );

    return fract(sin(hashInput) * 43758.5453123);
}

// Return F2 - F1: the distance difference between the second-nearest
// and nearest feature points. Values approach zero along cell borders.
float voronoiNoise(vec3 samplePosition)
{
    vec3 cell = floor(samplePosition);
    vec3 localPosition = fract(samplePosition);
    float nearestDistanceSquared = 1e10;
    float secondNearestDistanceSquared = 1e10;

    for (int z = -1; z <= 1; ++z) {
        for (int y = -1; y <= 1; ++y) {
            for (int x = -1; x <= 1; ++x) {
                vec3 neighbor = vec3(float(x), float(y), float(z));
                vec3 featurePoint = voronoiHash(cell + neighbor);
                vec3 toFeaturePoint = neighbor + featurePoint - localPosition;
                float distanceSquared = dot(toFeaturePoint, toFeaturePoint);

                if (distanceSquared < nearestDistanceSquared) {
                    secondNearestDistanceSquared = nearestDistanceSquared;
                    nearestDistanceSquared = distanceSquared;
                } else if (distanceSquared < secondNearestDistanceSquared) {
                    secondNearestDistanceSquared = distanceSquared;
                }
            }
        }
    }

    return sqrt(secondNearestDistanceSquared)
        - sqrt(nearestDistanceSquared);
}

// ====================================================================================================

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
        float centerFresnel = FresnelMask(
            normalize(u_CameraPos - fs_WorldPos),
            normalize(fs_Nor.xyz),
            u_CenterFresnelBias,
            u_CenterFresnelScale,
            u_CenterFresnelPower
        );
        float centerFresnelMask =
            (1.0 - step(u_CenterFresnelThreshold, centerFresnel))
            * (1.0 - centerFresnel);

        vec3 perlinSamplePosition = fs_WorldPos;
        perlinSamplePosition.xy *= vec2(u_PerlinScaleX, u_PerlinScaleY);
        perlinSamplePosition.xy += vec2(u_PerlinSpeedX, u_PerlinSpeedY) * u_Time;
        float perlinValue = 1.0 - piecewiseLinearPerlin(
            perlinSamplePosition,
            u_FireTextureTesselation
        );

        // Voronoi Noise mask;
        vec3 voronoiSamplePosition = fs_WorldPos;
        voronoiSamplePosition.xy *= vec2(u_VoronoiScaleX, u_VoronoiScaleY);
        voronoiSamplePosition.xy += vec2(u_VoronoiSpeedX, u_VoronoiSpeedY) * u_Time;
        float voronoi = voronoiNoise(voronoiSamplePosition);
        float ashMask = smoothstep(
            u_AshThreshold - u_VoronoiEdgeWidth,
            u_AshThreshold,
            voronoi
        );

        // A second, independently seeded Voronoi layer named Tornado.
        vec3 tornadoSamplePosition = fs_WorldPos;
        tornadoSamplePosition.xy *= vec2(u_TornadoScaleX, u_TornadoScaleY);
        tornadoSamplePosition.xy += vec2(u_TornadoSpeedX, u_TornadoSpeedY) * u_Time;
        tornadoSamplePosition += vec3(17.3, 41.7, 9.2);
        float tornado = voronoiNoise(tornadoSamplePosition);
        float tornadoMask = smoothstep(
            u_TornadoThreshold - u_TornadoEdgeWidth,
            u_TornadoThreshold,
            tornado
        );


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
        fireBallColor = mix(
            fireBallColor,
            u_FresnelCenterColor.rgb,
            centerFresnelMask
        );

        // Ash Dots

        fireBallColor = mix(
            fireBallColor,
            u_AshColor.rgb,
            ashMask
        );

        // Tornado Voronoi layer
        fireBallColor = mix(
            fireBallColor,
            u_TornadoColor.rgb,
            tornadoMask
        );


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
