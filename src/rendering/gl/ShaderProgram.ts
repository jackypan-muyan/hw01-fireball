import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;
  unifSineAmplitude: WebGLUniformLocation;
  unifSineFrequency: WebGLUniformLocation;
  unifVertexSpeedX: WebGLUniformLocation;
  unifVertexSpeedY: WebGLUniformLocation;
  unifFbmScale: WebGLUniformLocation;
  unifFbmOctaves: WebGLUniformLocation;
  unifTailAmplitude: WebGLUniformLocation;
  unifVertexMaskThreshold: WebGLUniformLocation;
  unifGaussianWidth: WebGLUniformLocation;
  unifMaskedFbmIntensity: WebGLUniformLocation;
  unifCameraPos: WebGLUniformLocation;
  unifFresnelBias: WebGLUniformLocation;
  unifFresnelScale: WebGLUniformLocation;
  unifFresnelPower: WebGLUniformLocation;
  unifFresnelThreshold: WebGLUniformLocation;
  unifCenterFresnelBias: WebGLUniformLocation;
  unifCenterFresnelScale: WebGLUniformLocation;
  unifCenterFresnelPower: WebGLUniformLocation;
  unifCenterFresnelThreshold: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifPerlinSpeedX: WebGLUniformLocation;
  unifPerlinSpeedY: WebGLUniformLocation;
  unifPerlinScaleX: WebGLUniformLocation;
  unifPerlinScaleY: WebGLUniformLocation;
  unifPerlinThreshold: WebGLUniformLocation;
  unifVoronoiSpeedX: WebGLUniformLocation;
  unifVoronoiSpeedY: WebGLUniformLocation;
  unifVoronoiScaleX: WebGLUniformLocation;
  unifVoronoiScaleY: WebGLUniformLocation;
  unifVoronoiEdgeWidth: WebGLUniformLocation;
  unifFireRed: WebGLUniformLocation;
  unifFireOrange: WebGLUniformLocation;
  unifFireYellow: WebGLUniformLocation;
  unifFresnelCenterColor: WebGLUniformLocation;
  unifAshColor: WebGLUniformLocation;
  unifAshThreshold: WebGLUniformLocation;
  unifTornadoSpeedX: WebGLUniformLocation;
  unifTornadoSpeedY: WebGLUniformLocation;
  unifTornadoScaleX: WebGLUniformLocation;
  unifTornadoScaleY: WebGLUniformLocation;
  unifTornadoEdgeWidth: WebGLUniformLocation;
  unifTornadoThreshold: WebGLUniformLocation;
  unifTornadoColor: WebGLUniformLocation;
  unifFireFadeScalar: WebGLUniformLocation;
  unifFireFadePower: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
    this.unifSineAmplitude = gl.getUniformLocation(this.prog, 'u_SineAmplitude');
    this.unifSineFrequency = gl.getUniformLocation(this.prog, 'u_SineFrequency');
    this.unifVertexSpeedX = gl.getUniformLocation(this.prog, 'u_VertexSpeedX');
    this.unifVertexSpeedY = gl.getUniformLocation(this.prog, 'u_VertexSpeedY');
    this.unifFbmScale = gl.getUniformLocation(this.prog, 'u_FbmScale');
    this.unifFbmOctaves = gl.getUniformLocation(this.prog, 'u_FbmOctaves');
    this.unifTailAmplitude = gl.getUniformLocation(this.prog, 'u_TailAmplitude');
    this.unifVertexMaskThreshold = gl.getUniformLocation(this.prog, 'u_VertexMaskThreshold');
    this.unifGaussianWidth = gl.getUniformLocation(this.prog, 'u_GaussianWidth');
    this.unifMaskedFbmIntensity = gl.getUniformLocation(this.prog, 'u_MaskedFbmIntensity');
    this.unifCameraPos = gl.getUniformLocation(this.prog, 'u_CameraPos');
    this.unifFresnelBias = gl.getUniformLocation(this.prog, 'u_FresnelBias');
    this.unifFresnelScale = gl.getUniformLocation(this.prog, 'u_FresnelScale');
    this.unifFresnelPower = gl.getUniformLocation(this.prog, 'u_FresnelPower');
    this.unifFresnelThreshold = gl.getUniformLocation(this.prog, 'u_FresnelThreshold');
    this.unifCenterFresnelBias = gl.getUniformLocation(this.prog, 'u_CenterFresnelBias');
    this.unifCenterFresnelScale = gl.getUniformLocation(this.prog, 'u_CenterFresnelScale');
    this.unifCenterFresnelPower = gl.getUniformLocation(this.prog, 'u_CenterFresnelPower');
    this.unifCenterFresnelThreshold = gl.getUniformLocation(this.prog, 'u_CenterFresnelThreshold');
    this.unifTime = gl.getUniformLocation(this.prog, 'u_Time');
    this.unifPerlinSpeedX = gl.getUniformLocation(this.prog, 'u_PerlinSpeedX');
    this.unifPerlinSpeedY = gl.getUniformLocation(this.prog, 'u_PerlinSpeedY');
    this.unifPerlinScaleX = gl.getUniformLocation(this.prog, 'u_PerlinScaleX');
    this.unifPerlinScaleY = gl.getUniformLocation(this.prog, 'u_PerlinScaleY');
    this.unifPerlinThreshold = gl.getUniformLocation(this.prog, 'u_PerlinThreshold');
    this.unifVoronoiSpeedX = gl.getUniformLocation(this.prog, 'u_VoronoiSpeedX');
    this.unifVoronoiSpeedY = gl.getUniformLocation(this.prog, 'u_VoronoiSpeedY');
    this.unifVoronoiScaleX = gl.getUniformLocation(this.prog, 'u_VoronoiScaleX');
    this.unifVoronoiScaleY = gl.getUniformLocation(this.prog, 'u_VoronoiScaleY');
    this.unifVoronoiEdgeWidth = gl.getUniformLocation(this.prog, 'u_VoronoiEdgeWidth');
    this.unifFireRed = gl.getUniformLocation(this.prog, 'u_FireRed');
    this.unifFireOrange = gl.getUniformLocation(this.prog, 'u_FireOrange');
    this.unifFireYellow = gl.getUniformLocation(this.prog, 'u_FireYellow');
    this.unifFresnelCenterColor = gl.getUniformLocation(this.prog, 'u_FresnelCenterColor');
    this.unifAshColor = gl.getUniformLocation(this.prog, 'u_AshColor');
    this.unifAshThreshold = gl.getUniformLocation(this.prog, 'u_AshThreshold');
    this.unifTornadoSpeedX = gl.getUniformLocation(this.prog, 'u_TornadoSpeedX');
    this.unifTornadoSpeedY = gl.getUniformLocation(this.prog, 'u_TornadoSpeedY');
    this.unifTornadoScaleX = gl.getUniformLocation(this.prog, 'u_TornadoScaleX');
    this.unifTornadoScaleY = gl.getUniformLocation(this.prog, 'u_TornadoScaleY');
    this.unifTornadoEdgeWidth = gl.getUniformLocation(this.prog, 'u_TornadoEdgeWidth');
    this.unifTornadoThreshold = gl.getUniformLocation(this.prog, 'u_TornadoThreshold');
    this.unifTornadoColor = gl.getUniformLocation(this.prog, 'u_TornadoColor');
    this.unifFireFadeScalar = gl.getUniformLocation(this.prog, 'u_FireFadeScalar');
    this.unifFireFadePower = gl.getUniformLocation(this.prog, 'u_FireFadePower');
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setCameraPosition(position: vec3) {
    this.use();
    if (this.unifCameraPos !== null) {
      gl.uniform3fv(this.unifCameraPos, position);
    }
  }

  setVertexDeformation(amplitude: number, frequency: number, fbmScale: number, fbmOctaves: number) {
    this.use();
    if (this.unifSineAmplitude !== null) {
      gl.uniform1f(this.unifSineAmplitude, amplitude);
    }
    if (this.unifSineFrequency !== null) {
      gl.uniform1f(this.unifSineFrequency, frequency);
    }
    if (this.unifFbmScale !== null) {
      gl.uniform1f(this.unifFbmScale, fbmScale);
    }
    if (this.unifFbmOctaves !== null) {
      gl.uniform1i(this.unifFbmOctaves, fbmOctaves);
    }
  }

  setTailDeformation(
    amplitude: number,
    maskThreshold: number,
    gaussianWidth: number,
    maskedFbmIntensity: number,
  ) {
    this.use();
    if (this.unifTailAmplitude !== null) {
      gl.uniform1f(this.unifTailAmplitude, amplitude);
    }
    if (this.unifVertexMaskThreshold !== null) {
      gl.uniform1f(this.unifVertexMaskThreshold, maskThreshold);
    }
    if (this.unifGaussianWidth !== null) {
      gl.uniform1f(this.unifGaussianWidth, gaussianWidth);
    }
    if (this.unifMaskedFbmIntensity !== null) {
      gl.uniform1f(this.unifMaskedFbmIntensity, maskedFbmIntensity);
    }
  }

  setVertexAnimation(speedX: number, speedY: number) {
    this.use();
    if (this.unifVertexSpeedX !== null) {
      gl.uniform1f(this.unifVertexSpeedX, speedX);
    }
    if (this.unifVertexSpeedY !== null) {
      gl.uniform1f(this.unifVertexSpeedY, speedY);
    }
  }

  setFresnelParameters(bias: number, scale: number, power: number, threshold: number) {
    this.use();
    if (this.unifFresnelBias !== null) {
      gl.uniform1f(this.unifFresnelBias, bias);
    }
    if (this.unifFresnelScale !== null) {
      gl.uniform1f(this.unifFresnelScale, scale);
    }
    if (this.unifFresnelPower !== null) {
      gl.uniform1f(this.unifFresnelPower, power);
    }
    if (this.unifFresnelThreshold !== null) {
      gl.uniform1f(this.unifFresnelThreshold, threshold);
    }
  }

  setCenterFresnelParameters(bias: number, scale: number, power: number, threshold: number) {
    this.use();
    if (this.unifCenterFresnelBias !== null) {
      gl.uniform1f(this.unifCenterFresnelBias, bias);
    }
    if (this.unifCenterFresnelScale !== null) {
      gl.uniform1f(this.unifCenterFresnelScale, scale);
    }
    if (this.unifCenterFresnelPower !== null) {
      gl.uniform1f(this.unifCenterFresnelPower, power);
    }
    if (this.unifCenterFresnelThreshold !== null) {
      gl.uniform1f(this.unifCenterFresnelThreshold, threshold);
    }
  }

  setTime(time: number) {
    this.use();
    if (this.unifTime !== null) {
      gl.uniform1f(this.unifTime, time);
    }
  }

  setPerlinAnimation(speedX: number, speedY: number) {
    this.use();
    if (this.unifPerlinSpeedX !== null) {
      gl.uniform1f(this.unifPerlinSpeedX, speedX);
    }
    if (this.unifPerlinSpeedY !== null) {
      gl.uniform1f(this.unifPerlinSpeedY, speedY);
    }
  }

  setPerlinScale(scaleX: number, scaleY: number) {
    this.use();
    if (this.unifPerlinScaleX !== null) {
      gl.uniform1f(this.unifPerlinScaleX, scaleX);
    }
    if (this.unifPerlinScaleY !== null) {
      gl.uniform1f(this.unifPerlinScaleY, scaleY);
    }
  }

  setPerlinThreshold(threshold: number) {
    this.use();
    if (this.unifPerlinThreshold !== null) {
      gl.uniform1f(this.unifPerlinThreshold, threshold);
    }
  }

  setVoronoiParameters(
    speedX: number,
    speedY: number,
    scaleX: number,
    scaleY: number,
    edgeWidth: number,
  ) {
    this.use();
    if (this.unifVoronoiSpeedX !== null) {
      gl.uniform1f(this.unifVoronoiSpeedX, speedX);
    }
    if (this.unifVoronoiSpeedY !== null) {
      gl.uniform1f(this.unifVoronoiSpeedY, speedY);
    }
    if (this.unifVoronoiScaleX !== null) {
      gl.uniform1f(this.unifVoronoiScaleX, scaleX);
    }
    if (this.unifVoronoiScaleY !== null) {
      gl.uniform1f(this.unifVoronoiScaleY, scaleY);
    }
    if (this.unifVoronoiEdgeWidth !== null) {
      gl.uniform1f(this.unifVoronoiEdgeWidth, edgeWidth);
    }
  }

  setFireColors(red: vec4, orange: vec4, yellow: vec4, fresnelCenter: vec4) {
    this.use();
    if (this.unifFireRed !== null) {
      gl.uniform4fv(this.unifFireRed, red);
    }
    if (this.unifFireOrange !== null) {
      gl.uniform4fv(this.unifFireOrange, orange);
    }
    if (this.unifFireYellow !== null) {
      gl.uniform4fv(this.unifFireYellow, yellow);
    }
    if (this.unifFresnelCenterColor !== null) {
      gl.uniform4fv(this.unifFresnelCenterColor, fresnelCenter);
    }
  }

  setAshParameters(color: vec4, threshold: number) {
    this.use();
    if (this.unifAshColor !== null) {
      gl.uniform4fv(this.unifAshColor, color);
    }
    if (this.unifAshThreshold !== null) {
      gl.uniform1f(this.unifAshThreshold, threshold);
    }
  }

  setTornadoParameters(
    speedX: number,
    speedY: number,
    scaleX: number,
    scaleY: number,
    edgeWidth: number,
    threshold: number,
    color: vec4,
  ) {
    this.use();
    if (this.unifTornadoSpeedX !== null) {
      gl.uniform1f(this.unifTornadoSpeedX, speedX);
    }
    if (this.unifTornadoSpeedY !== null) {
      gl.uniform1f(this.unifTornadoSpeedY, speedY);
    }
    if (this.unifTornadoScaleX !== null) {
      gl.uniform1f(this.unifTornadoScaleX, scaleX);
    }
    if (this.unifTornadoScaleY !== null) {
      gl.uniform1f(this.unifTornadoScaleY, scaleY);
    }
    if (this.unifTornadoEdgeWidth !== null) {
      gl.uniform1f(this.unifTornadoEdgeWidth, edgeWidth);
    }
    if (this.unifTornadoThreshold !== null) {
      gl.uniform1f(this.unifTornadoThreshold, threshold);
    }
    if (this.unifTornadoColor !== null) {
      gl.uniform4fv(this.unifTornadoColor, color);
    }
  }

  setFireFadeParameters(fadeScalar: number, fadePower: number) {
    this.use();
    if (this.unifFireFadeScalar !== null) {
      gl.uniform1f(this.unifFireFadeScalar, fadeScalar);
    }
    if (this.unifFireFadePower !== null) {
      gl.uniform1f(this.unifFireFadePower, fadePower);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
