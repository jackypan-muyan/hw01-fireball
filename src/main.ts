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
  fresnelBias: 0.38,
  fresnelScale: 1.0,
  fresnelPower: 2.0,
  fresnelThreshold: 0.5,
  centerFresnelBias: 0.0,
  centerFresnelScale: 1.0,
  centerFresnelPower: 2.0,
  centerFresnelThreshold: 0.5,
  perlinSpeedX: 10.0,
  perlinSpeedY: 10.0,
  perlinScaleX: 10.0,
  perlinScaleY: 4.2,
  perlinThreshold: 0.49,
  fireTextureTesselation: 1,
  fireRed: [120, 0, 0],
  fireOrange: [255, 122, 0],
  fireYellow: [255, 251, 0],
  fresnelCenterColor: [255, 255, 255],
  'Load Scene': loadScene, // A function pointer, essentially
};

function colorToVec4(color: number[]): vec4 {
  return vec4.fromValues(
    color[0] / 255.0,
    color[1] / 255.0,
    color[2] / 255.0,
    1.0,
  );
}

let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = controls.tesselations;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
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
  gui.add(controls, 'perlinThreshold', 0.0, 1.0).step(0.01).name('Perlin Threshold');
  gui.add(controls, 'fireTextureTesselation', 1, 20).step(1).name('Fire Texture Tesselation');
  gui.addColor(controls, 'fireRed').name('Fire Red');
  gui.addColor(controls, 'fireOrange').name('Fire Orange');
  gui.addColor(controls, 'fireYellow').name('Fire Yellow');
  gui.addColor(controls, 'fresnelCenterColor').name('Fresnel Center Color');
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
    }
    const elapsedTime = (performance.now() - startTime) / 1000.0;
    lambert.setTime(elapsedTime);
    lambert.setVertexDeformation(
      controls.sineAmplitude,
      controls.sineFrequency,
      controls.fbmScale,
      controls.fbmOctaves,
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
    lambert.setPerlinThreshold(controls.perlinThreshold);
    lambert.setFireTextureTesselation(controls.fireTextureTesselation);
    lambert.setFireColors(
      colorToVec4(controls.fireRed),
      colorToVec4(controls.fireOrange),
      colorToVec4(controls.fireYellow),
      colorToVec4(controls.fresnelCenterColor),
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
    renderer.render(camera, lambert, [
      icosphere,
      // square,
    ]);
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
