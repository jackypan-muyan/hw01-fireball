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
  unifCameraPos: WebGLUniformLocation;
  unifFresnelBias: WebGLUniformLocation;
  unifFresnelScale: WebGLUniformLocation;
  unifFresnelPower: WebGLUniformLocation;
  unifFresnelThreshold: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifPerlinSpeedX: WebGLUniformLocation;
  unifPerlinSpeedY: WebGLUniformLocation;
  unifPerlinScaleX: WebGLUniformLocation;
  unifPerlinScaleY: WebGLUniformLocation;
  unifPerlinThreshold: WebGLUniformLocation;
  unifFireRed: WebGLUniformLocation;
  unifFireOrange: WebGLUniformLocation;
  unifFireYellow: WebGLUniformLocation;

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
    this.unifCameraPos = gl.getUniformLocation(this.prog, 'u_CameraPos');
    this.unifFresnelBias = gl.getUniformLocation(this.prog, 'u_FresnelBias');
    this.unifFresnelScale = gl.getUniformLocation(this.prog, 'u_FresnelScale');
    this.unifFresnelPower = gl.getUniformLocation(this.prog, 'u_FresnelPower');
    this.unifFresnelThreshold = gl.getUniformLocation(this.prog, 'u_FresnelThreshold');
    this.unifTime = gl.getUniformLocation(this.prog, 'u_Time');
    this.unifPerlinSpeedX = gl.getUniformLocation(this.prog, 'u_PerlinSpeedX');
    this.unifPerlinSpeedY = gl.getUniformLocation(this.prog, 'u_PerlinSpeedY');
    this.unifPerlinScaleX = gl.getUniformLocation(this.prog, 'u_PerlinScaleX');
    this.unifPerlinScaleY = gl.getUniformLocation(this.prog, 'u_PerlinScaleY');
    this.unifPerlinThreshold = gl.getUniformLocation(this.prog, 'u_PerlinThreshold');
    this.unifFireRed = gl.getUniformLocation(this.prog, 'u_FireRed');
    this.unifFireOrange = gl.getUniformLocation(this.prog, 'u_FireOrange');
    this.unifFireYellow = gl.getUniformLocation(this.prog, 'u_FireYellow');
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

  setFireColors(red: vec4, orange: vec4, yellow: vec4) {
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
