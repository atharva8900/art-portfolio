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
  float graphite(vec2 uv, float scale) {
    // We removed u_time here to stop the constant idle shimmer
    float n = noise(uv * scale);
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
    float fine   = graphite(uv, 720.0);
    // Coarse layer → larger, irregular flakes
    float coarse = graphite(uv, 280.0);
    // Combine: mostly fine with accents of coarse
    float g = fine * 0.70 + coarse * 0.30;

    // We removed the 'sparkle' logic as it required u_time constant updates
    
    // ── Level 2 : Scroll boosts opacity ──────────────────────────────────
    float base      = 0.06;
    float scrollAmt = clamp(u_scroll, 0.0, 1.0) * 0.07;
    float mouseAmt  = swirl * 0.04;
    float alpha     = (base + scrollAmt + mouseAmt) * g;

    // ── Theme : colour of the graphite particles ──────────────────────────
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
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const dpr = isTouchDevice ? 0.75 : Math.min(window.devicePixelRatio, 1.5); // drop DPR on touch devices
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

    // ── Render on Demand ────────────────────────────────────────────────
    let needsRender = true;
    const requestRender = () => { needsRender = true; };

    // ── Resize ───────────────────────────────────────────────────────────
    const onResize = () => {
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
      requestRender();
    };
    window.addEventListener("resize", onResize);

    // ── Scroll → Level 2 ─────────────────────────────────────────────────
    const onScroll = () => {
      uniforms.u_scroll.value = Math.min(window.scrollY / window.innerHeight, 1);
      requestRender();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Mouse / Touch → Level 3 ──────────────────────────────────────────
    const setMouse = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      uniforms.u_mouse.value.set(
        (cx - r.left) / r.width,
        1.0 - (cy - r.top) / r.height  // flip Y for WebGL
      );
      requestRender();
    };
    const onMouse = (e: MouseEvent) => setMouse(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length) setMouse(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    // ── Render loop (Throttled by RAF but only draws if flag is set) ─────
    let raf: number;
    let visible = true;
    let isMenuOpen = false;

    const onMenuToggle = (e: Event) => {
      isMenuOpen = (e as CustomEvent).detail.isOpen;
    };
    window.addEventListener("navbar-menu-toggle", onMenuToggle);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      
      // Pick up theme changes as potential render triggers
      if (uniforms.u_isDark.value !== isDarkRef.current) {
        uniforms.u_isDark.value = isDarkRef.current;
        requestRender();
      }

      if (!visible || !needsRender || isMenuOpen) return;
      
      renderer.render(scene, camera);
      needsRender = false;
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
      window.removeEventListener("navbar-menu-toggle", onMenuToggle);
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
