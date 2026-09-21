#version 300 es

precision highp float;

in vec3 fs_WorldPos;
in float fs_GaussianMask;

uniform float u_Time;
uniform float u_FragmentSineFrequency;
uniform float u_FragmentSineAmplitude;
uniform float u_FragmentSineSpeed;
uniform float u_FragmentSineMaskPower;
uniform vec4 u_FragmentSineColor;

out vec4 out_Col;
const vec3 backVector = normalize(vec3(-1.0, -1.0, -1.0));

void main()
{
    float backPosition = dot(fs_WorldPos, backVector);
    float sineValue = u_FragmentSineAmplitude * sin(
        backPosition * u_FragmentSineFrequency
        + u_Time * u_FragmentSineSpeed
    );

    if (sineValue < 0.0) {
        discard;
    }

    float inverseGaussianMask = pow(
        1.0 - fs_GaussianMask,
        u_FragmentSineMaskPower
    );

    out_Col = vec4(
        u_FragmentSineColor.rgb,
        u_FragmentSineColor.a * sineValue * inverseGaussianMask
    );
}
