"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";

// ─── GLSL ────────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float u_time;
  uniform float u_scroll;
  uniform vec2  u_mouse;    // 0..1 UV space
  uniform float u_isDark;   // 1.0 = dark mode, 0.0 = light mode
  varying vec2  vUv;

  // ── Hash function ─────────────────────────────────────────────────────────
  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  // ── Smooth value noise ────────────────────────────────────────────────────
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep
    return mix(
      mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0,1.)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // ── Graphite flake: high-contrast noise with sharp cutoff ────────────────
  float graphite(vec2 uv, float scale, float time) {
    float n = noise(uv * scale + time);
    // threshold + steep ramp → sharp-edged dark "flakes"
    n = smoothstep(0.38, 0.62, n);
    return n;
  }

  void main() {
    vec2 uv = vUv;

    // ── Level 3 : Mouse swirl ─────────────────────────────────────────────
    float dist  = distance(uv, u_mouse);
    float swirl = smoothstep(0.38, 0.0, dist);
    // perturb sample coords toward cursor
    uv += (u_mouse - uv) * swirl * 0.07;

    // ── Level 1 : Multi-scale graphite noise ──────────────────────────────
    // Fine layer  → micro graphite dust
    float fine   = graphite(uv, 720.0, u_time * 0.6);
    // Coarse layer → larger, irregular flakes
    float coarse = graphite(uv, 280.0, u_time * 0.3 + 5.1); // phase-shifted
    // Combine: mostly fine with accents of coarse
    float g = fine * 0.70 + coarse * 0.30;

    // Optional: tiny random sparkle to break up uniformity
    float sparkle = step(0.985, hash(vUv * 1200.0 + u_time));
    g = max(g, sparkle * 0.5);

    // ── Level 2 : Scroll boosts opacity ──────────────────────────────────
    float base      = 0.06;
    float scrollAmt = clamp(u_scroll, 0.0, 1.0) * 0.07;
    float mouseAmt  = swirl * 0.04;
    float alpha     = (base + scrollAmt + mouseAmt) * g;

    // ── Theme : colour of the graphite particles ──────────────────────────
    // Dark mode  → warm near-white  (graphite shimmer on black)
    // Light mode → cool dark-grey   (pencil dust on white paper)
    vec3 darkColor  = vec3(0.88, 0.86, 0.84);   // warm white
    vec3 lightColor = vec3(0.22, 0.22, 0.24);   // cool dark grey
    vec3 col = mix(lightColor, darkColor, u_isDark);

    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  // Keep a ref to the uniform so the render loop can read it without re-mounting
  const isDarkRef = useRef<number>(resolvedTheme === "light" ? 0.0 : 1.0);

  // Update the ref whenever the theme changes (no re-mount needed)
  useEffect(() => {
    isDarkRef.current = resolvedTheme === "light" ? 0.0 : 1.0;
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ─────────────────────────────────────────────────────────
    const dpr = Math.min(window.devicePixelRatio, 1.0); // cap at 1× on mobile
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    // ── Scene (orthographic full-screen quad) ────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      u_time: { value: 0.0 },
      u_scroll: { value: 0.0 },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_isDark: { value: isDarkRef.current },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(geometry, material));

    // ── Resize ───────────────────────────────────────────────────────────
    const onResize = () => renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    window.addEventListener("resize", onResize);

    // ── Scroll → Level 2 ─────────────────────────────────────────────────
    const onScroll = () => {
      uniforms.u_scroll.value = Math.min(window.scrollY / window.innerHeight, 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Mouse / Touch → Level 3 ──────────────────────────────────────────
    const setMouse = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      uniforms.u_mouse.value.set(
        (cx - r.left) / r.width,
        1.0 - (cy - r.top) / r.height  // flip Y for WebGL
      );
    };
    const onMouse = (e: MouseEvent) => setMouse(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length) setMouse(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    // ── Render loop ──────────────────────────────────────────────────────
    let raf: number;
    let visible = true;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      uniforms.u_time.value = t * 0.001;
      uniforms.u_isDark.value = isDarkRef.current; // pick up theme changes
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    // Pause when hero is off-screen (saves battery / GPU)
    const observer = new IntersectionObserver(
      ([e]) => { visible = e.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []); // mount once — theme handled via isDarkRef

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 8 }}
      aria-hidden="true"
    />
  );
}
