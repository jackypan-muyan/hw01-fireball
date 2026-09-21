#version 300 es

precision highp float;

in vec3 fs_WorldPos;
in float fs_GaussianMask;

uniform vec4 u_FireYellow;
uniform vec4 u_FireLayer2Color;
uniform float u_Time;
uniform float u_PerlinSpeedX;
uniform float u_PerlinSpeedY;
uniform float u_PerlinScaleX;
uniform float u_PerlinScaleY;
uniform float u_PerlinThreshold;
uniform float u_PerlinThreshold2;
uniform float u_FireFadeScalar;
uniform float u_FireFadePower;

out vec4 out_Col;

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

void main()
{
    vec3 samplePosition = fs_WorldPos;
    samplePosition.xy *= vec2(u_PerlinScaleX, u_PerlinScaleY);
    samplePosition.xy += vec2(u_PerlinSpeedX, u_PerlinSpeedY) * u_Time;

    float perlinValue = 1.0 - perlinNoise(samplePosition);
    float layer1Mask = 1.0 - step(u_PerlinThreshold, perlinValue);
    float layer2Mask = 1.0 - step(u_PerlinThreshold2, perlinValue);
    float opacity = max(layer1Mask, layer2Mask);

    if (opacity < 0.5) {
        discard;
    }

    // Layer 2 supplies the wider/base color. Layer 1 is drawn on top wherever
    // its threshold is active.
    vec4 fireLayerColor = mix(
        u_FireLayer2Color,
        u_FireYellow,
        layer1Mask
    );

    float poweredGaussianMask = pow(
        clamp(fs_GaussianMask, 0.0, 1.0),
        max(u_FireFadePower, 0.0001)
    );
    float gaussianFade = clamp(
        poweredGaussianMask * u_FireFadeScalar,
        0.0,
        1.0
    );
    float gaussianOpacity = 1.0 - gaussianFade;
    out_Col = vec4(
        fireLayerColor.rgb,
        fireLayerColor.a * gaussianOpacity
    );
}
