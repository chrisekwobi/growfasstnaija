import { useEffect, useRef, useState, type ReactNode } from "react";

const EMERALD = 0x2ec99a;
const ORANGE = 0xff9a2e;

/**
 * Decorative three.js growth network for the homepage hero.
 * three.js is loaded on demand; the static fallback shows during SSR, on
 * reduced-motion preferences, when WebGL is unavailable and until the scene is ready.
 */
export function HeroScene({ fallback }: { fallback: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 720px)").matches;
    let cancelled = false;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (cancelled) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: "low-power" }); }
      catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.75));
      renderer.domElement.setAttribute("aria-hidden", "true");
      element.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
      camera.position.set(0, 0, 8);
      const group = new THREE.Group();
      scene.add(group);

      const count = small ? 380 : 900;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = Math.PI * (3 - Math.sqrt(5)) * i;
        const r = 1.7 + (i % 5) * 0.02;
        positions.set([Math.cos(theta) * radius * r, y * r, Math.sin(theta) * radius * r], i * 3);
      }
      const pointGeometry = new THREE.BufferGeometry();
      pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pointMaterial = new THREE.PointsMaterial({ color: EMERALD, size: small ? 0.04 : 0.032, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
      group.add(new THREE.Points(pointGeometry, pointMaterial));

      const coreGeometry = new THREE.IcosahedronGeometry(1.05, 1);
      const core = new THREE.Mesh(coreGeometry, new THREE.MeshBasicMaterial({ color: EMERALD, wireframe: true, transparent: true, opacity: 0.22 }));
      group.add(core);

      const rings = [
        { radius: 2.25, tilt: 1.2, color: ORANGE, opacity: 0.85 },
        { radius: 2.55, tilt: -0.6, color: EMERALD, opacity: 0.5 },
        { radius: 2.9, tilt: 0.25, color: 0xffffff, opacity: 0.18 },
      ].map(({ radius, tilt, color, opacity }) => {
        const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.008, 8, 160), new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
        mesh.rotation.x = tilt;
        group.add(mesh);
        return mesh;
      });

      const target = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        const box = element.getBoundingClientRect();
        target.x = ((event.clientX - box.left) / box.width - 0.5) * 0.6;
        target.y = ((event.clientY - box.top) / box.height - 0.5) * 0.4;
      };
      if (!small) window.addEventListener("pointermove", onPointer, { passive: true });

      const resize = () => {
        const { width, height } = element.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      resize();

      let frame = 0;
      let visible = true;
      let last = performance.now();
      const render = (now: number) => {
        const delta = Math.min((now - last) / 1000, 0.05);
        last = now;
        group.rotation.y += delta * 0.18;
        group.rotation.x += (target.y - group.rotation.x) * 0.04;
        group.position.x += (target.x - group.position.x) * 0.04;
        core.rotation.y -= delta * 0.3;
        rings.forEach((ring, index) => { ring.rotation.z += delta * (0.12 + index * 0.05) * (index % 2 ? -1 : 1); });
        renderer.render(scene, camera);
        if (visible && !reduceMotion) frame = requestAnimationFrame(render);
      };
      const start = () => { cancelAnimationFrame(frame); last = performance.now(); frame = requestAnimationFrame(render); };
      const io = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); if (visible && !document.hidden) start(); else cancelAnimationFrame(frame); });
      io.observe(element);
      const onVisibility = () => { if (document.hidden) cancelAnimationFrame(frame); else if (visible) start(); };
      document.addEventListener("visibilitychange", onVisibility);

      renderer.render(scene, camera);
      setReady(true);
      if (!reduceMotion) start();

      cleanup = () => {
        cancelAnimationFrame(frame);
        io.disconnect();
        observer.disconnect();
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        pointGeometry.dispose(); pointMaterial.dispose(); coreGeometry.dispose();
        core.material.dispose();
        rings.forEach((ring) => { ring.geometry.dispose(); (ring.material as InstanceType<typeof THREE.MeshBasicMaterial>).dispose(); });
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => { cancelled = true; cleanup(); };
  }, []);

  return (
    <div className="hero-visual" data-ready={ready}>
      <div className="hero-fallback">{fallback}</div>
      <div className="hero-canvas" ref={host} />
    </div>
  );
}
