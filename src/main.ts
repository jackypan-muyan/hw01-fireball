import {vec3, vec4} from 'gl-matrix';
import Stats from 'stats-js';
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

import lambertVertSource from './shaders/lambert-vert.glsl?raw';
import lambertFragSource from './shaders/lambert-frag.glsl?raw';
import fireLayerFragSource from './shaders/fire-layer-frag.glsl?raw';
import sineLayerFragSource from './shaders/sine-layer-frag.glsl?raw';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 8,
  sineAmplitude: 0.07,
  sineFrequency: 9.2,
  vertexSpeedX: 1.8,
  vertexSpeedY: 0.0,
  fbmScale: 13.0,
  fbmOctaves: 1,
  tailAmplitude: 1.5,
  vertexMaskThreshold: 0.0,
  gaussianWidth: 0.35,
  maskedFbmIntensity: 2.0,
  fireFadeScalar: 1.3,
  fireFadePower: 0.4,
  fresnelBias: 0.38,
  fresnelScale: 1.0,
  fresnelPower: 3.1,
  fresnelThreshold: 0.57,
  centerFresnelBias: 0.0,
  centerFresnelScale: 2.0,
  centerFresnelPower: 4.1,
  centerFresnelThreshold: 0.02,
  perlinSpeedX: 2.8,
  perlinSpeedY: 6.0,
  perlinScaleX: 4.6,
  perlinScaleY: 1.6,
  perlinThreshold: 0.32,
  perlinThreshold2: 0.48,
  voronoiSpeedX: 0.0,
  voronoiSpeedY: 7.0,
  voronoiScaleX: 9.6,
  voronoiScaleY: 4.2,
  voronoiEdgeWidth: 0.1,
  ashThreshold: 0.6,
  tornadoSpeedX: 0.0,
  tornadoSpeedY: 12.0,
  tornadoScaleX: 10.0,
  tornadoScaleY: 0.6,
  tornadoEdgeWidth: 0.42,
  tornadoThreshold: 0.6,
  fireRed: [118, 0, 0],
  fireOrange: [255, 122, 0],
  fireYellow: [255, 255, 255],
  fireLayer2Color: [255, 219, 0],
  fragmentSineFrequency: 4.0,
  fragmentSineAmplitude: 0.63,
  fragmentSineSpeed: -30.0,
  fragmentSineMaskPower: 1.0,
  fragmentSineColor: [255, 255, 255],
  fragmentSineAlpha: 0.06,
  fresnelCenterColor: [255, 207, 0],
  ashColor: [80, 18, 18],
  tornadoColor: [109, 0, 0],
  'Load Scene': loadScene, // A function pointer, essentially
};

function colorToVec4(color: number[], alpha: number = 1.0): vec4 {
  return vec4.fromValues(
    color[0] / 255.0,
    color[1] / 255.0,
    color[2] / 255.0,
    alpha,
  );
}

let icosphere: Icosphere;
let fireIcosphere: Icosphere;
let sineIcosphere: Icosphere;
let square: Square;
let prevTesselations: number = controls.tesselations;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  fireIcosphere = new Icosphere(
    vec3.fromValues(0, 0, 0),
    1.1,
    controls.tesselations,
  );
  fireIcosphere.create();
  sineIcosphere = new Icosphere(
    vec3.fromValues(0, 0, 0),
    1.2,
    controls.tesselations,
  );
  sineIcosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'sineAmplitude', 0.0, 0.5).step(0.01).name('Sine Amplitude');
  gui.add(controls, 'sineFrequency', 0.0, 20.0).step(0.1).name('Sine Frequency');
  gui.add(controls, 'vertexSpeedX', 0.0, 30.0).step(0.01).name('Vertex Speed X');
  gui.add(controls, 'vertexSpeedY', 0.0, 30.0).step(0.01).name('Vertex Speed Y');
  gui.add(controls, 'fbmScale', 0.0, 50.0).step(0.1).name('fBM Scale');
  gui.add(controls, 'fbmOctaves', 1, 8).step(1).name('fBM Octaves');
  gui.add(controls, 'tailAmplitude', 0.0, 10.0).step(0.01).name('Tail Amplitude');
  gui.add(controls, 'vertexMaskThreshold', 0.0, 1.0).step(0.01).name('Vertex Mask Threshold');
  gui.add(controls, 'gaussianWidth', 0.01, 1.0).step(0.01).name('Gaussian Width');
  gui.add(controls, 'maskedFbmIntensity', 1.0, 10.0).step(0.1).name('Masked fBM Intensity');
  gui.add(controls, 'fireFadeScalar', 0.0, 10.0).step(0.01).name('Fire Fade Scalar');
  gui.add(controls, 'fireFadePower', 0.1, 10.0).step(0.1).name('Fire Fade Power');
  gui.add(controls, 'fresnelBias', 0.0, 1.0).step(0.01).name('Fresnel Bias');
  gui.add(controls, 'fresnelScale', 0.0, 2.0).step(0.01).name('Fresnel Scale');
  gui.add(controls, 'fresnelPower', 0.1, 10.0).step(0.1).name('Fresnel Power');
  gui.add(controls, 'fresnelThreshold', 0.0, 1.0).step(0.01).name('Fresnel Threshold');
  gui.add(controls, 'centerFresnelBias', 0.0, 1.0).step(0.01).name('Center Fresnel Bias');
  gui.add(controls, 'centerFresnelScale', 0.0, 2.0).step(0.01).name('Center Fresnel Scale');
  gui.add(controls, 'centerFresnelPower', 0.1, 10.0).step(0.1).name('Center Fresnel Power');
  gui.add(controls, 'centerFresnelThreshold', 0.0, 1.0).step(0.01).name('Center Fresnel Threshold');
  gui.add(controls, 'perlinSpeedX', 0.0, 30.0).step(0.01).name('Perlin Speed X');
  gui.add(controls, 'perlinSpeedY', 0.0, 30.0).step(0.01).name('Perlin Speed Y');
  gui.add(controls, 'perlinScaleX', 0.1, 10.0).step(0.1).name('Perlin Scale X');
  gui.add(controls, 'perlinScaleY', 0.1, 10.0).step(0.1).name('Perlin Scale Y');
  gui.add(controls, 'perlinThreshold', 0.0, 1.0).step(0.01).name('Perlin Threshold 1');
  gui.add(controls, 'perlinThreshold2', 0.0, 1.0).step(0.01).name('Perlin Threshold 2');
  gui.add(controls, 'voronoiSpeedX', 0.0, 30.0).step(0.01).name('Voronoi Speed X');
  gui.add(controls, 'voronoiSpeedY', 0.0, 30.0).step(0.01).name('Voronoi Speed Y');
  gui.add(controls, 'voronoiScaleX', 0.1, 10.0).step(0.1).name('Voronoi Scale X');
  gui.add(controls, 'voronoiScaleY', 0.1, 10.0).step(0.1).name('Voronoi Scale Y');
  gui.add(controls, 'voronoiEdgeWidth', 0.001, 1.0).step(0.001).name('Voronoi Edge Width');
  gui.add(controls, 'ashThreshold', 0.0, 1.0).step(0.01).name('Ash Threshold');
  gui.add(controls, 'tornadoSpeedX', 0.0, 30.0).step(0.01).name('Tornado Speed X');
  gui.add(controls, 'tornadoSpeedY', 0.0, 30.0).step(0.01).name('Tornado Speed Y');
  gui.add(controls, 'tornadoScaleX', 0.1, 10.0).step(0.1).name('Tornado Scale X');
  gui.add(controls, 'tornadoScaleY', 0.1, 10.0).step(0.1).name('Tornado Scale Y');
  gui.add(controls, 'tornadoEdgeWidth', 0.001, 1.0).step(0.001).name('Tornado Edge Width');
  gui.add(controls, 'tornadoThreshold', 0.0, 1.0).step(0.01).name('Tornado Threshold');
  gui.addColor(controls, 'fireRed').name('Fire Red');
  gui.addColor(controls, 'fireOrange').name('Fire Orange');
  gui.addColor(controls, 'fireYellow').name('Fire Layer 1 Color');
  gui.addColor(controls, 'fireLayer2Color').name('Fire Layer 2 Color');
  gui.add(controls, 'fragmentSineFrequency', 0.0, 30.0).step(0.1).name('Outer Sine Frequency');
  gui.add(controls, 'fragmentSineAmplitude', 0.0, 2.0).step(0.01).name('Outer Sine Amplitude');
  gui.add(controls, 'fragmentSineSpeed', -30.0, 30.0).step(0.1).name('Outer Sine Speed');
  gui.add(controls, 'fragmentSineMaskPower', 0.1, 10.0).step(0.1).name('Outer Sine Mask Power');
  gui.addColor(controls, 'fragmentSineColor').name('Outer Sine Color');
  gui.add(controls, 'fragmentSineAlpha', 0.0, 1.0).step(0.01).name('Outer Sine Alpha');
  gui.addColor(controls, 'fresnelCenterColor').name('Fresnel Center Color');
  gui.addColor(controls, 'ashColor').name('Ash Color');
  gui.addColor(controls, 'tornadoColor').name('Tornado Color');
  gui.add(controls, 'Load Scene');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, lambertVertSource),
    new Shader(gl.FRAGMENT_SHADER, lambertFragSource),
  ]);
  const fireLayer = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, lambertVertSource),
    new Shader(gl.FRAGMENT_SHADER, fireLayerFragSource),
  ]);
  const sineLayer = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, lambertVertSource),
    new Shader(gl.FRAGMENT_SHADER, sineLayerFragSource),
  ]);
  const startTime = performance.now();

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
      fireIcosphere = new Icosphere(
        vec3.fromValues(0, 0, 0),
        1.1,
        prevTesselations,
      );
      fireIcosphere.create();
      sineIcosphere = new Icosphere(
        vec3.fromValues(0, 0, 0),
        1.2,
        prevTesselations,
      );
      sineIcosphere.create();
    }
    const elapsedTime = (performance.now() - startTime) / 1000.0;
    lambert.setTime(elapsedTime);
    lambert.setVertexDeformation(
      controls.sineAmplitude,
      controls.sineFrequency,
      controls.fbmScale,
      controls.fbmOctaves,
    );
    lambert.setTailDeformation(
      controls.tailAmplitude,
      controls.vertexMaskThreshold,
      controls.gaussianWidth,
      controls.maskedFbmIntensity,
    );
    lambert.setVertexAnimation(
      controls.vertexSpeedX,
      controls.vertexSpeedY,
    );
    lambert.setPerlinAnimation(
      controls.perlinSpeedX,
      controls.perlinSpeedY,
    );
    lambert.setPerlinScale(
      controls.perlinScaleX,
      controls.perlinScaleY,
    );
    lambert.setPerlinThreshold(
      controls.perlinThreshold,
      controls.perlinThreshold2,
    );
    lambert.setVoronoiParameters(
      controls.voronoiSpeedX,
      controls.voronoiSpeedY,
      controls.voronoiScaleX,
      controls.voronoiScaleY,
      controls.voronoiEdgeWidth,
    );
    lambert.setAshParameters(
      colorToVec4(controls.ashColor),
      controls.ashThreshold,
    );
    lambert.setTornadoParameters(
      controls.tornadoSpeedX,
      controls.tornadoSpeedY,
      controls.tornadoScaleX,
      controls.tornadoScaleY,
      controls.tornadoEdgeWidth,
      controls.tornadoThreshold,
      colorToVec4(controls.tornadoColor),
    );
    lambert.setFireFadeParameters(
      controls.fireFadeScalar,
      controls.fireFadePower,
    );
    lambert.setFireColors(
      colorToVec4(controls.fireRed),
      colorToVec4(controls.fireOrange),
      colorToVec4(controls.fireYellow),
      colorToVec4(controls.fresnelCenterColor),
      colorToVec4(controls.fireLayer2Color),
    );
    lambert.setFresnelParameters(
      controls.fresnelBias,
      controls.fresnelScale,
      controls.fresnelPower,
      controls.fresnelThreshold,
    );
    lambert.setCenterFresnelParameters(
      controls.centerFresnelBias,
      controls.centerFresnelScale,
      controls.centerFresnelPower,
      controls.centerFresnelThreshold,
    );

    fireLayer.setTime(elapsedTime);
    fireLayer.setVertexDeformation(
      controls.sineAmplitude,
      controls.sineFrequency,
      controls.fbmScale,
      controls.fbmOctaves,
    );
    fireLayer.setTailDeformation(
      controls.tailAmplitude,
      controls.vertexMaskThreshold,
      controls.gaussianWidth,
      controls.maskedFbmIntensity,
    );
    fireLayer.setVertexAnimation(
      controls.vertexSpeedX,
      controls.vertexSpeedY,
    );
    fireLayer.setPerlinAnimation(
      controls.perlinSpeedX,
      controls.perlinSpeedY,
    );
    fireLayer.setPerlinScale(
      controls.perlinScaleX,
      controls.perlinScaleY,
    );
    fireLayer.setPerlinThreshold(
      controls.perlinThreshold,
      controls.perlinThreshold2,
    );
    fireLayer.setFireFadeParameters(
      controls.fireFadeScalar,
      controls.fireFadePower,
    );
    fireLayer.setFireColors(
      colorToVec4(controls.fireRed),
      colorToVec4(controls.fireOrange),
      colorToVec4(controls.fireYellow),
      colorToVec4(controls.fresnelCenterColor),
      colorToVec4(controls.fireLayer2Color),
    );

    sineLayer.setTime(elapsedTime);
    sineLayer.setVertexDeformation(
      controls.sineAmplitude,
      controls.sineFrequency,
      controls.fbmScale,
      controls.fbmOctaves,
    );
    sineLayer.setTailDeformation(
      controls.tailAmplitude,
      controls.vertexMaskThreshold,
      controls.gaussianWidth,
      controls.maskedFbmIntensity,
    );
    sineLayer.setVertexAnimation(
      controls.vertexSpeedX,
      controls.vertexSpeedY,
    );
    sineLayer.setFragmentSineParameters(
      controls.fragmentSineFrequency,
      controls.fragmentSineAmplitude,
      controls.fragmentSineSpeed,
      controls.fragmentSineMaskPower,
      colorToVec4(
        controls.fragmentSineColor,
        controls.fragmentSineAlpha,
      ),
    );

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    renderer.render(camera, lambert, [
      icosphere,
      // square,
    ]);

    gl.depthMask(false);
    renderer.render(camera, fireLayer, [fireIcosphere]);
    renderer.render(camera, sineLayer, [sineIcosphere]);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
