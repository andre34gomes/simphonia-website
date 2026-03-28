/**
 * Interactive 3D Globe — Three.js
 *
 * Creates a wireframe globe with glowing city nodes and
 * animated connection arcs. Mouse-parallax + auto-rotation.
 *
 * Performance notes:
 *  – Sphere segments reduced from 48→32 (visually identical at wireframe opacity)
 *  – Ambient particles reduced from 300→150
 *  – Pixel-ratio capped at 2
 *  – Render loop pauses when the tab is hidden or the globe is off-screen
 *  – prefers-reduced-motion bail-out
 */

function initGlobe(containerId = 'globe-container') {
  const container = document.getElementById(containerId);
  if (!container || window.innerWidth < 768) return;

  // Respect user preference — no animation at all
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const THREE = window.THREE;
  if (!THREE) {
    console.warn('[Globe] Three.js not loaded');
    return;
  }

  // --- Scene Setup ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(3, 0.5, 10);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // --- Globe Geometry (32 segments — visually identical to 48 at 0.08 opacity) ---
  const globeRadius = 4;
  const globeGeometry = new THREE.SphereGeometry(globeRadius, 32, 32);
  const globeMaterial = new THREE.MeshBasicMaterial({
    color: 0xD4AF37,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  scene.add(globe);

  // --- Inner glow sphere ---
  const innerGeometry = new THREE.SphereGeometry(globeRadius * 0.98, 24, 24);
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xD4AF37,
    transparent: true,
    opacity: 0.02,
    side: THREE.BackSide,
  });
  const innerGlow = new THREE.Mesh(innerGeometry, innerMaterial);
  globe.add(innerGlow);

  // --- City Nodes ---
  const cities = [
    { lat: 38.7, lon: -9.1, name: 'Lisbon' },
    { lat: 48.86, lon: 2.35, name: 'Paris' },
    { lat: 35.68, lon: 139.69, name: 'Tokyo' },
    { lat: 40.71, lon: -74.01, name: 'New York' },
    { lat: 25.20, lon: 55.27, name: 'Dubai' },
    { lat: -33.87, lon: 151.21, name: 'Sydney' },
    { lat: 51.51, lon: -0.13, name: 'London' },
    { lat: 1.35, lon: 103.82, name: 'Singapore' },
    { lat: -23.55, lon: -46.63, name: 'São Paulo' },
    { lat: 37.57, lon: 126.98, name: 'Seoul' },
    { lat: 55.75, lon: 37.62, name: 'Moscow' },
    { lat: 19.43, lon: -99.13, name: 'Mexico City' },
  ];

  function latLonToVec3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  // City dots
  const dotPositions = [];
  cities.forEach(city => {
    const pos = latLonToVec3(city.lat, city.lon, globeRadius * 1.01);
    dotPositions.push(pos.x, pos.y, pos.z);
  });

  const dotGeometry = new THREE.BufferGeometry();
  dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
  const dotMaterial = new THREE.PointsMaterial({
    color: 0xFFD740,
    size: 0.12,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });
  const dots = new THREE.Points(dotGeometry, dotMaterial);
  globe.add(dots);

  // --- Connection Arcs ---
  const connections = [
    [0, 1],  // Lisbon → Paris
    [1, 6],  // Paris → London
    [3, 6],  // NY → London
    [4, 7],  // Dubai → Singapore
    [2, 9],  // Tokyo → Seoul
    [8, 3],  // São Paulo → NY
    [5, 7],  // Sydney → Singapore
  ];

  connections.forEach(([a, b]) => {
    const start = latLonToVec3(cities[a].lat, cities[a].lon, globeRadius * 1.01);
    const end = latLonToVec3(cities[b].lat, cities[b].lon, globeRadius * 1.01);

    // Mid-point elevated above surface for the arc
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const midLen = mid.length();
    mid.normalize().multiplyScalar(midLen + 1.2);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const curvePoints = curve.getPoints(32);
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.15,
    });
    const line = new THREE.Line(curveGeometry, curveMaterial);
    globe.add(line);
  });

  // --- Ambient Particles (150 — halved from 300, visually equivalent) ---
  const particleCount = 150;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3]     = (Math.random() - 0.5) * 16;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.03,
    transparent: true,
    opacity: 0.4,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // --- Mouse Parallax ---
  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.001;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.001;
  });

  // --- Visibility & intersection state ---
  // Pause the render loop when the tab is hidden OR the globe is off-screen.
  let visible = true;
  let tabActive = true;

  document.addEventListener('visibilitychange', () => {
    tabActive = !document.hidden;
  });

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { threshold: 0.05 });
  io.observe(container);

  // --- Animation Loop ---
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);

    // Skip rendering when the tab is hidden or the globe is scrolled out of view
    if (!tabActive || !visible) return;

    // Auto rotation
    globe.rotation.y += 0.001;

    // Mouse parallax (smooth follow)
    targetRotX += (mouseY - targetRotX) * 0.02;
    targetRotY += (mouseX - targetRotY) * 0.02;
    globe.rotation.x = targetRotX * 0.5;
    globe.rotation.y += targetRotY * 0.01;

    // Particle drift
    particles.rotation.y += 0.0003;
    particles.rotation.x += 0.0001;

    renderer.render(scene, camera);
  }

  animate();

  // --- Resize ---
  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize, { passive: true });

  // Cleanup (in case of SPA navigation)
  return () => {
    cancelAnimationFrame(animId);
    io.disconnect();
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}
