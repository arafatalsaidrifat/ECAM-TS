import React, { useEffect, useRef } from 'react';
import type { DomainCode } from '../types';

type RGB = [number, number, number];
const PALETTE: Record<DomainCode, { accent: RGB; secondary: RGB }> = {
  'BD-ELEC-H': { accent: [13, 148, 136], secondary: [94, 234, 212] },
  'BD-FOOD-M': { accent: [180, 83, 9], secondary: [251, 191, 36] },
  'BD-WEAT-D': { accent: [37, 99, 235], secondary: [147, 197, 253] },
  'EXT-AIR-H': { accent: [124, 58, 237], secondary: [196, 181, 253] },
};

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec3 u_accent;
uniform vec3 u_secondary;

void main() {
  vec2 st = gl_FragCoord.xy / max(u_resolution, vec2(1.0));
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / max(min(u_resolution.x, u_resolution.y), 1.0);
  vec2 mouse = (u_mouse - 0.5 * u_resolution) / max(min(u_resolution.x, u_resolution.y), 1.0);

  float flowA = sin(p.x * 3.1 + sin(p.y * 2.2 + u_time * 0.17));
  float flowB = cos(p.y * 4.2 - p.x * 1.4 - u_time * 0.12);
  float ridge = 0.5 + 0.5 * sin(p.x * 3.4 - p.y * 2.0 + flowA * 0.8 + flowB * 0.28);
  float edge = 1.0 - smoothstep(0.04, 1.08, length(p) - flowA * 0.05);
  float pointerGlow = exp(-length(p - mouse) * 3.8);
  vec3 fluid = mix(u_accent, u_secondary, ridge);
  fluid *= 0.10 + 0.24 * edge + 0.20 * pointerGlow;
  fluid += u_secondary * pointerGlow * 0.09;

  vec3 deep = vec3(0.018, 0.047, 0.080);
  vec3 color = mix(deep, fluid, 0.74);
  color += u_accent * (0.025 * (1.0 - st.y));
  gl_FragColor = vec4(color, 0.70);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('WebGL shader allocation failed.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compile error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

/**
 * Decorative, low-resolution WebGL backdrop. The app's CSS gradient remains visible
 * if WebGL is unavailable, the context is lost, or shader compilation fails.
 */
export const FluidGradientCanvas: React.FC<{ domain: DomainCode }> = ({ domain }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palette = PALETTE[domain];

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let buffer: WebGLBuffer | null = null;
    let frame = 0;
    let lastFrameAt = 0;
    let disposed = false;
    let hasDrawnReducedFrame = false;
    let pixelScale = 0.7;
    let pointerX = 0;
    let pointerY = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const color = (rgb: RGB): Float32Array => new Float32Array(rgb.map(value => value / 255));

    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: 'low-power',
      });
      if (!gl) {
        canvas.dataset.fallback = 'true';
        return;
      }

      vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) throw new Error('WebGL program allocation failed.');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Unknown WebGL link error.');
      }

      buffer = gl.createBuffer();
      if (!buffer) throw new Error('WebGL buffer allocation failed.');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(gl.getUniformLocation(program, 'u_accent'), color(palette.accent));
      gl.uniform3fv(gl.getUniformLocation(program, 'u_secondary'), color(palette.secondary));

      const resize = () => {
        const rect = host.getBoundingClientRect();
        pixelScale = Math.min(window.devicePixelRatio || 1, 1.25) * 0.7;
        canvas.width = Math.max(1, Math.floor(rect.width * pixelScale));
        canvas.height = Math.max(1, Math.floor(rect.height * pixelScale));
        gl?.viewport(0, 0, canvas.width, canvas.height);
        const resolution = gl?.getUniformLocation(program, 'u_resolution');
        if (resolution) gl?.uniform2f(resolution, canvas.width, canvas.height);
        if (pointerX === 0 && pointerY === 0) {
          pointerX = canvas.width * 0.68;
          pointerY = canvas.height * 0.55;
        }
      };

      const movePointer = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        pointerX = Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * pixelScale));
        pointerY = Math.max(0, Math.min(canvas.height, canvas.height - (event.clientY - rect.top) * pixelScale));
      };
      const leavePointer = () => {
        pointerX = canvas.width * 0.68;
        pointerY = canvas.height * 0.55;
      };

      const render = (now: number) => {
        frame = 0;
        if (disposed || document.visibilityState === 'hidden') return;
        if (!reduceMotion.matches && now - lastFrameAt < 32) {
          frame = window.requestAnimationFrame(render);
          return;
        }
        lastFrameAt = now;
        if (gl && program) {
          gl.useProgram(program);
          const timeUniform = gl.getUniformLocation(program, 'u_time');
          const mouseUniform = gl.getUniformLocation(program, 'u_mouse');
          if (timeUniform) gl.uniform1f(timeUniform, reduceMotion.matches ? 0 : now * 0.001);
          if (mouseUniform) gl.uniform2f(mouseUniform, pointerX, pointerY);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        if (reduceMotion.matches) {
          hasDrawnReducedFrame = true;
          return;
        }
        frame = window.requestAnimationFrame(render);
      };

      const start = () => {
        if (frame === 0 && !disposed && document.visibilityState !== 'hidden' && !(reduceMotion.matches && hasDrawnReducedFrame)) {
          frame = window.requestAnimationFrame(render);
        }
      };
      const visibilityChange = () => {
        if (document.visibilityState === 'hidden' && frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        } else {
          start();
        }
      };
      const motionChange = () => {
        hasDrawnReducedFrame = false;
        start();
      };
      const contextLost = (event: Event) => {
        event.preventDefault();
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        canvas.dataset.fallback = 'true';
      };

      resize();
      host.addEventListener('pointermove', movePointer, { passive: true });
      host.addEventListener('pointerleave', leavePointer, { passive: true });
      window.addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', visibilityChange);
      reduceMotion.addEventListener('change', motionChange);
      canvas.addEventListener('webglcontextlost', contextLost);
      start();

      return () => {
        disposed = true;
        if (frame) window.cancelAnimationFrame(frame);
        host.removeEventListener('pointermove', movePointer);
        host.removeEventListener('pointerleave', leavePointer);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', visibilityChange);
        reduceMotion.removeEventListener('change', motionChange);
        canvas.removeEventListener('webglcontextlost', contextLost);
        if (buffer) gl?.deleteBuffer(buffer);
        if (program) gl?.deleteProgram(program);
        if (vertex) gl?.deleteShader(vertex);
        if (fragment) gl?.deleteShader(fragment);
      };
    } catch (error) {
      canvas.dataset.fallback = 'true';
      canvas.style.display = 'none';
      console.warn('ECAM-TS decorative WebGL background unavailable; using CSS fallback.', error);
    }

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (buffer) gl?.deleteBuffer(buffer);
      if (program) gl?.deleteProgram(program);
      if (vertex) gl?.deleteShader(vertex);
      if (fragment) gl?.deleteShader(fragment);
    };
  }, [domain]);

  return <canvas ref={canvasRef} className="ecam-fluid-canvas" aria-hidden="true" />;
};
