import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

const STYLES = [
  { id: 'Classic', label: '经典蓝', brandColor: '#2563EB', textColor: '#FFFFFF' },
  { id: 'Midnight', label: '极夜黑', brandColor: '#0F172A', textColor: '#F1F5F9' },
  { id: 'Retro', label: '复古橙', brandColor: '#D97706', textColor: '#FFFFFF' },
  { id: 'Forest', label: '森林绿', brandColor: '#059669', textColor: '#FFFFFF' },
];

const EraserViewer = () => {
  const canvasRef = useRef(null);
  const [style, setStyle] = useState(STYLES[0]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 4, 6);

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
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new THREE.Scene();
    roomEnv.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })));
    const light1 = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    light1.position.set(0, 4.9, 0);
    light1.rotation.x = Math.PI / 2;
    roomEnv.add(light1);
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.3);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.radius = 3;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xeef2ff, 0.5);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.12, color: 0x111827 }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.9;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const sleeveCanvas = document.createElement('canvas');
    sleeveCanvas.width = 1024;
    sleeveCanvas.height = 512;
    const sleeveCtx = sleeveCanvas.getContext('2d');
    const sleeveTexture = new THREE.CanvasTexture(sleeveCanvas);
    sleeveTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const drawSleeve = (brandColor, textColor) => {
      const ctx = sleeveCtx;
      const w = 1024;
      const h = 512;
      ctx.fillStyle = '#F9FAFB';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i += 1) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.fillStyle = brandColor;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 4, -h / 2);
      ctx.lineTo(w / 4 - 60, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.fill();
      ctx.fillStyle = brandColor;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(w / 4 + 20, -h / 2, 20, h);
      ctx.globalAlpha = 1.0;
      ctx.font = 'bold 150px "Ma Shan Zheng", serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = textColor;
      ctx.fillText('云科', -320, 0);
      ctx.font = '700 32px "Inter", sans-serif';
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.9;
      ctx.fillText('PROFESSIONAL GRADE', -310, 80);
      ctx.beginPath();
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 8;
      ctx.arc(250, 0, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'center';
      ctx.fillText('4B', 250, 5);
      ctx.restore();
      sleeveTexture.needsUpdate = true;
    };

    drawSleeve(style.brandColor, style.textColor);

    const eraserGroup = new THREE.Group();
    const rubber = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 1.8),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.0, transmission: 0.05, thickness: 1.0 }),
    );
    rubber.castShadow = true;
    rubber.receiveShadow = true;
    eraserGroup.add(rubber);

    const sleeveGeo = new THREE.BoxGeometry(3.0, 1.23, 1.83);
    const sleeveMat = new THREE.MeshStandardMaterial({ map: sleeveTexture, roughness: 0.7, bumpMap: sleeveTexture, bumpScale: 0.002 });
    const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeveMesh.position.x = -0.3;
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    eraserGroup.add(sleeveMesh);
    scene.add(eraserGroup);

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
  }, [style]);

  const handleStyle = (item) => {
    setStyle(item);
  };

  return (
    <div className="viewer-shell">
      <div className="instruction">INTERACTIVE ERASER • DRAG TO ROTATE</div>
      <div className="viewer-canvas" ref={canvasRef} />
      <div className="ui-overlay scrollable">
        <span className="label">Collection</span>
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`text-btn${style.id === s.id ? ' active' : ''}`}
            onClick={() => handleStyle(s)}
          >
            <span className="dot" style={{ background: s.brandColor }} />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EraserViewer;
