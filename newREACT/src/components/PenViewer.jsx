import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPen } from './three/objects';

const COLORS = [
  { label: 'Slate Black', bodyColor: 0x1e293b },
  { label: 'Ceramic White', bodyColor: 0xf8fafc },
  { label: 'Tech Blue', bodyColor: 0x2563eb },
  { label: 'Amber', bodyColor: 0xd97706 },
];

const PenViewer = () => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new THREE.Scene();
    roomEnv.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })));
    const topLight = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    topLight.position.set(0, 4.9, 0);
    topLight.rotation.x = Math.PI / 2;
    roomEnv.add(topLight);
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.radius = 3;
    scene.add(mainLight);

    const pen = createPen({ accent: 0x2563eb, bodyColor: color.bodyColor, flatShading: false });
    pen.position.set(0, 0, 0);
    pen.rotation.set(Math.PI / 4, -Math.PI / 6, -Math.PI / 4);
    scene.add(pen);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    let frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      container.innerHTML = '';
    };
  }, [color]);

  return (
    <div className="viewer-shell">
      <div className="instruction">DRAG TO ROTATE • SCROLL TO ZOOM</div>
      <div className="viewer-canvas" ref={canvasRef} />
      <div className="ui-overlay pill">
        {COLORS.map((c) => (
          <button
            key={c.label}
            type="button"
            className={`color-btn${color.label === c.label ? ' active' : ''}`}
            style={{ background: `#${c.bodyColor.toString(16).padStart(6, '0')}` }}
            onClick={() => setColor(c)}
            title={c.label}
          />
        ))}
      </div>
    </div>
  );
};

export default PenViewer;
