import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { zoomToNode, resetCameraPosition, getDefaultCameraPosition, getDefaultCameraTarget } from './animations.js';

const NODE_DEFINITIONS = [
  { id: 'node-01', label: 'ATHENA SPIRE', lat: 45.5, lon: -73.6, videoId: 'v01' },
  { id: 'node-02', label: 'NEON BASTION', lat: 35.7, lon: 139.7, videoId: 'v02' },
  { id: 'node-03', label: 'POLAR LISTENER', lat: 64.1, lon: -21.9, videoId: 'v06' },
  { id: 'node-04', label: 'ORBITAL RING', lat: 0.0, lon: 23.3, videoId: 'v02' },
  { id: 'node-05', label: 'DESERT ARRAY', lat: 23.4, lon: 55.2, videoId: 'v05' },
  { id: 'node-06', label: 'PACIFIC WATCH', lat: 14.6, lon: -90.5, videoId: 'v03' },
  { id: 'node-07', label: 'TUNDRA NODE', lat: 69.7, lon: 135.0, videoId: 'v06' },
  { id: 'node-08', label: 'HORIZON GATE', lat: -33.9, lon: 151.2, videoId: 'v04' },
  { id: 'node-09', label: 'LUNAR HANDOFF', lat: 28.7, lon: -17.9, videoId: 'v04' },
  { id: 'node-10', label: 'CRIMSON PORT', lat: 52.3, lon: 13.4, videoId: 'v03' },
  { id: 'node-11', label: 'AEGIS GRID', lat: -1.3, lon: 36.8, videoId: 'v05' },
  { id: 'node-12', label: 'CHRONOS RELAY', lat: 19.4, lon: -99.1, videoId: 'v01' }
];

const EARTH_RADIUS = 1;

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (err) {
    return false;
  }
}

function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function initFallbackScene({ container, canvas, onNodeHover, onNodeLeave, onNodeClick }) {
  canvas.hidden = false;
  canvas.removeAttribute('aria-hidden');
  const ctx = canvas.getContext('2d');
  const nodeSize = 10;
  const accessibleNodes = NODE_DEFINITIONS.map((node) => ({ ...node }));

  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    render();
  }

  function projectTo2D(lat, lon) {
    const x = ((lon + 180) / 360) * canvas.width;
    const y = ((90 - lat) / 180) * canvas.height;
    return { x, y };
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createRadialGradient(
      canvas.width * 0.5,
      canvas.height * 0.4,
      canvas.width * 0.1,
      canvas.width * 0.5,
      canvas.height * 0.5,
      canvas.width * 0.6
    );
    gradient.addColorStop(0, 'rgba(15, 198, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(3, 6, 10, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    NODE_DEFINITIONS.forEach((node) => {
      const { x, y } = projectTo2D(node.lat, node.lon);
      ctx.strokeStyle = 'rgba(15, 198, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, nodeSize * 1.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(127, 232, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function handlePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    let hovered = null;
    NODE_DEFINITIONS.forEach((node) => {
      const { x, y } = projectTo2D(node.lat, node.lon);
      const distance = Math.hypot(x - px, y - py);
      if (distance < nodeSize * 1.6) {
        hovered = node;
      }
    });
    if (hovered) {
      onNodeHover({ ...hovered }, { x: event.clientX, y: event.clientY });
    } else {
      onNodeLeave();
    }
  }

  function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    let selected = null;
    NODE_DEFINITIONS.forEach((node) => {
      const { x, y } = projectTo2D(node.lat, node.lon);
      const distance = Math.hypot(x - px, y - py);
      if (distance < nodeSize * 1.6) {
        selected = node;
      }
    });
    if (selected) {
      onNodeClick({ ...selected });
    }
  }

  canvas.addEventListener('mousemove', handlePointer);
  canvas.addEventListener('mouseleave', onNodeLeave);
  canvas.addEventListener('click', handleClick);
  window.addEventListener('resize', resize);
  resize();

  return {
    focusOnNode() {},
    resetView() {},
    pauseRotation() {},
    resumeRotation() {},
    setReduceMotion() {},
    getAccessibleNodes: () => accessibleNodes.map((node) => ({ ...node })),
    isFallback: () => true
  };
}

export function initScene({
  container,
  fallbackCanvas,
  getReduceMotion,
  onNodeHover,
  onNodeLeave,
  onNodeClick
}) {
  const prefersFallback = window.matchMedia('(max-width: 720px)').matches;
  if (!supportsWebGL() || prefersFallback) {
    return initFallbackScene({
      container,
      canvas: fallbackCanvas,
      onNodeHover,
      onNodeLeave,
      onNodeClick
    });
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020409, 0.16);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  const defaultCameraPosition = getDefaultCameraPosition();
  const cameraTarget = getDefaultCameraTarget();
  camera.position.copy(defaultCameraPosition);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Lighting
  const ambient = new THREE.AmbientLight(0x0c1019, 1.4);
  const rimLight = new THREE.DirectionalLight(0x7fe8ff, 0.7);
  rimLight.position.set(-3, 2, 4);
  scene.add(ambient, rimLight);

  // Earth mesh
  const sphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 72, 72);
  const sphereMaterial = new THREE.MeshPhongMaterial({
    color: 0x062c45,
    emissive: 0x04121f,
    specular: 0x0fc6ff,
    shininess: 12,
    transparent: true,
    opacity: 0.95
  });
  const earthMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  globeGroup.add(earthMesh);

  const wireframe = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(EARTH_RADIUS * 1.001, 32, 16)),
    new THREE.LineBasicMaterial({ color: 0x0fc6ff, transparent: true, opacity: 0.25 })
  );
  globeGroup.add(wireframe);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.12, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x0fc6ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
  );
  globeGroup.add(halo);

  const nodeMeshes = [];
  const nodeLines = [];
  const accessibleNodes = [];

  NODE_DEFINITIONS.forEach((node) => {
    const position = latLongToVector3(node.lat, node.lon, EARTH_RADIUS * 1.02);
    const nodeGeometry = new THREE.SphereGeometry(0.035, 16, 16);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x7fe8ff });
    const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
    nodeMesh.position.copy(position);
    nodeMesh.userData = {
      ...node,
      position: position.clone(),
      baseColor: nodeMaterial.color.clone()
    };
    globeGroup.add(nodeMesh);
    nodeMeshes.push(nodeMesh);

    const controlPoint = position.clone().multiplyScalar(1.12);
    const apex = position.clone().multiplyScalar(1.22);
    const curve = new THREE.CatmullRomCurve3([position.clone(), controlPoint, apex]);
    const points = curve.getPoints(24);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0fc6ff,
      transparent: true,
      opacity: 0.35
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    globeGroup.add(line);
    nodeLines.push({ line, material: lineMaterial, offset: Math.random() * Math.PI * 2 });

    accessibleNodes.push({ ...node, position: position.clone() });
  });

  const nodeHighlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  nodeHighlight.visible = false;
  globeGroup.add(nodeHighlight);

  const state = {
    hovered: null,
    rotationPaused: false,
    reduceMotion: (typeof getReduceMotion === "function" ? !!getReduceMotion() : false),
    frameId: null
  };

  function handlePointerMove(event) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(nodeMeshes, false);
    if (intersects.length > 0) {
      const target = intersects[0].object;
      if (state.hovered !== target) {
        clearHovered();
        applyHovered(target);
      }
      onNodeHover(target.userData, { x: event.clientX, y: event.clientY });
    } else if (state.hovered) {
      clearHovered();
      onNodeLeave();
    }
  }

  function handlePointerLeave() {
    clearHovered();
    onNodeLeave();
  }

  function handleClick(event) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(nodeMeshes, false);
    if (intersects.length > 0) {
      const target = intersects[0].object;
      onNodeClick(target.userData);
    }
  }

  function applyHovered(mesh) {
    mesh.material.color.setHex(0xffffff);
    mesh.scale.setScalar(1.6);
    nodeHighlight.position.copy(mesh.position);
    nodeHighlight.visible = true;
    state.hovered = mesh;
  }

  function clearHovered() {
    if (state.hovered) {
      state.hovered.material.color.copy(state.hovered.userData.baseColor);
      state.hovered.scale.setScalar(1);
      state.hovered = null;
    }
    nodeHighlight.visible = false;
  }

  renderer.domElement.addEventListener('mousemove', handlePointerMove);
  renderer.domElement.addEventListener('mouseleave', handlePointerLeave);
  renderer.domElement.addEventListener('click', handleClick);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }, 120);
  });

  function animate(time) {
    const delta = time * 0.001;
    if (!state.rotationPaused) {
      const rotationSpeed = state.reduceMotion ? 0.0006 : 0.0016;
      globeGroup.rotation.y += rotationSpeed * (state.reduceMotion ? 0.6 : 1);
      const tiltAmplitude = state.reduceMotion ? 0.01 : 0.03;
      globeGroup.rotation.x = Math.sin(delta * 0.45) * tiltAmplitude;
    }

    nodeLines.forEach(({ material, offset }) => {
      const intensity = 0.35 + Math.sin(delta * 3 + offset) * 0.15;
      material.opacity = state.reduceMotion ? 0.2 : intensity;
    });

    halo.material.opacity = state.reduceMotion ? 0.12 : 0.18 + Math.sin(delta * 1.5) * 0.02;

    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    state.frameId = requestAnimationFrame(animate);
  }
  state.frameId = requestAnimationFrame(animate);

  function focusOnNode(node) {
    zoomToNode({ camera, cameraTarget, node, reduceMotion: state.reduceMotion });
  }

  function resetView() {
    resetCameraPosition({ camera, cameraTarget, reduceMotion: state.reduceMotion });
  }

  function pauseRotation() {
    state.rotationPaused = true;
  }

  function resumeRotation() {
    state.rotationPaused = false;
  }

  function setReduceMotion(value) {
    state.reduceMotion = value;
  }

  return {
    focusOnNode,
    resetView,
    pauseRotation,
    resumeRotation,
    setReduceMotion,
    getAccessibleNodes: () => accessibleNodes.map((node) => ({ ...node })),
    isFallback: () => false
  };
}
