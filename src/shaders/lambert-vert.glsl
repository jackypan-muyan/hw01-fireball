#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

uniform float u_SineAmplitude;
uniform float u_SineFrequency;
uniform float u_VertexSpeedX;
uniform float u_VertexSpeedY;
uniform float u_FbmScale;
uniform int u_FbmOctaves;
uniform float u_Time;
uniform float u_TailAmplitude;
uniform float u_GaussianWidth;
uniform float u_MaskedFbmIntensity;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out vec3 fs_WorldPos;        // The position of each vertex in world space. This is implicitly passed to the fragment shader.
out float fs_GaussianMask;  // The fire layer uses the inverse of this mask as opacity.

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

const vec3 backVector = normalize(vec3(-1.0, -1.0, -1.0));

// Perlin Noise Functions =======================================================================
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
// ====================================================================================================

// Fractal Brownian Motion (FBM) ======================================================================================
float fbm(vec3 samplePosition)
{
    float value = 0.0;
    float octaveAmplitude = 0.5;
    float amplitudeSum = 0.0;

    for (int octave = 0; octave < 8; ++octave) {
        if (octave >= u_FbmOctaves) {
            break;
        }

        value += perlinNoise(samplePosition) * octaveAmplitude;
        amplitudeSum += octaveAmplitude;
        samplePosition *= 2.0;
        octaveAmplitude *= 0.5;
    }

    return value / max(amplitudeSum, 0.0001);
}
// ====================================================================================================

// Make the expansion strongest at the center of the selected cap and smoothly
// reduce it away from the back direction.
float GaussianMask(vec3 vertexPosition, float width)
{
    vec3 direction = normalize(vertexPosition);
    float cosAngle = clamp(dot(direction, backVector), -1.0, 1.0);
    float angle = acos(cosAngle);
    float safeWidth = max(width, 0.0001);
    float normalizedDistance = angle / safeWidth;
    return exp(-0.5 * normalizedDistance * normalizedDistance);
}

// ======================================================================================

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    // Noramal
    vec3 objectNormal = normalize(vs_Nor.xyz);

    // Apply the Gaussian expansion before evaluating the animated fBM.
    float gaussianMask = GaussianMask(vs_Pos.xyz, u_GaussianWidth);
    float vertexGaussianMask = gaussianMask;
    fs_GaussianMask = vertexGaussianMask;
    float tailDisplacement =
        vertexGaussianMask
        * u_TailAmplitude;
    vec3 expandedPosition =
        vs_Pos.xyz
        + tailDisplacement * objectNormal;

    // Position used to sample the animated fBM.
    vec2 vertexVelocity = vec2(u_VertexSpeedX, u_VertexSpeedY);
    vec3 animatedPosition = expandedPosition;
    animatedPosition.xy += vertexVelocity * u_Time;

    // FBM amplitude
    float fbmAmplitude = fbm(animatedPosition * u_FbmScale);
    float maskedFbmIntensity = mix(
        1.0,
        u_MaskedFbmIntensity,
        vertexGaussianMask
    );
    fbmAmplitude *= maskedFbmIntensity;

    // Sine wave displacement
    float vertexSpeed = length(vertexVelocity);
    vec2 waveDirection = vertexSpeed > 0.0001
        ? vertexVelocity / vertexSpeed
        : vec2(0.0, 1.0);
    float sineCurve = sin(
        dot(animatedPosition.xy, waveDirection) * u_SineFrequency);

    // Displace the vertex position along its normal based on the sine wave and FBM amplitude
    float displacement = sineCurve * u_SineAmplitude * fbmAmplitude;
    vec4 displacedPosition = vec4(
        expandedPosition + displacement * objectNormal,
        vs_Pos.w
    );

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.



    vec4 modelposition = u_Model * displacedPosition;   // Temporarily store the transformed vertex positions for use below

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies
    fs_WorldPos = modelposition.xyz;          // Pass the vertex positions to the fragment shader for interpolation

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
