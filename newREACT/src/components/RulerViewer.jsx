import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// 材质预设，与原 HTML 一致
const MATERIALS = [
  { id: 'Frost', label: '磨砂亚克力', dot: '#A5F3FC' },
  { id: 'Metal', label: '拉丝金属', dot: '#94A3B8' },
  { id: 'Midnight', label: '黑金流光', dot: '#0F172A' },
];

// Scoped 样式，避免全局污染
const overlayClass = 'ruler-ui-overlay';
const btnClass = 'ruler-text-btn';
const activeClass = 'active';
const shellClass = 'ruler-viewer-shell';
const canvasClass = 'ruler-viewer-canvas';
const instructionClass = 'ruler-instruction';

const RulerViewer = () => {
  const canvasRef = useRef(null);
  const [preset, setPreset] = useState(MATERIALS[0]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return undefined;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 8);

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
    controls.autoRotateSpeed = 0.5;

    // Env & lights
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new THREE.Scene();
    roomEnv.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })));
    const light1 = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    light1.position.set(0, 4.9, 0);
    light1.rotation.x = Math.PI / 2;
    roomEnv.add(light1);
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.radius = 3;
    scene.add(mainLight);

    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.15, color: 0x111827 }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.15;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Ruler creation (one mesh reused on material change)
    const width = 8;
    const height = 0.15;
    const depth = 1.5;
    const geometry = new THREE.BoxGeometry(width, height, depth);

    const rulerCanvas = document.createElement('canvas');
    rulerCanvas.width = 2048;
    rulerCanvas.height = 512;
    const rulerCtx = rulerCanvas.getContext('2d');
    const rulerTexture = new THREE.CanvasTexture(rulerCanvas);
    rulerTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const drawRulerTexture = (color, isDarkBg) => {
      const ctx = rulerCtx;
      const w = rulerCanvas.width;
      const h = rulerCanvas.height;
      ctx.clearRect(0, 0, w, h);
      if (isDarkBg) {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, w, h);
      }
      // 增加浅底，确保数字可见
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(0, h - 240, w, 240);

      ctx.fillStyle = color;
      const startX = 100;
      const endX = w - 100;
      const totalUnits = 20;
      const step = (endX - startX) / totalUnits;

      // cm ticks + numbers
      for (let i = 0; i <= totalUnits; i += 1) {
        const x = startX + i * step;
        ctx.fillRect(x - 2, 0, 4, 120);
        ctx.font = 'bold 50px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(i.toString(), x, 140);
        if (i < totalUnits) {
          for (let j = 1; j < 10; j += 1) {
            const mmX = x + (step / 10) * j;
            const hh = j === 5 ? 80 : 50;
            ctx.fillRect(mmX - 1, 0, 2, hh);
          }
        }
      }

      // Logo
      ctx.save();
      ctx.translate(w / 2, h - 120);
      ctx.font = 'bold 140px "Ma Shan Zheng"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isDarkBg) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
      }
      ctx.fillText('云科', 0, 0);
      ctx.font = '40px "Inter"';
      ctx.globalAlpha = 0.7;
      ctx.fillText('PRECISION INSTRUMENT', 0, 80);
      ctx.restore();

      rulerTexture.needsUpdate = true;
    };

    // Initial material & mesh
    const makeMaterial = (type) => {
      if (type === 'Frost') {
        drawRulerTexture('#111827', false);
        return new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          transmission: 0.95,
          opacity: 1,
          metalness: 0,
          roughness: 0.2,
          thickness: 1.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          transparent: true,
        });
      }
      if (type === 'Metal') {
        drawRulerTexture('#1E293B', false);
        return new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.4,
          metalness: 0.9,
          envMapIntensity: 1.5,
        });
      }
      // Midnight
      drawRulerTexture('#FCD34D', true);
      return new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        roughness: 0.2,
        metalness: 0.5,
        transmission: 0.6,
        thickness: 2.0,
        clearcoat: 1.0,
        transparent: true,
      });
    };

    const rulerMesh = new THREE.Mesh(geometry, makeMaterial(preset.id));
    rulerMesh.castShadow = true;
    rulerMesh.receiveShadow = true;
    scene.add(rulerMesh);

    // 前后刻度贴图平面
    const baseLabelMat = new THREE.MeshBasicMaterial({
      map: rulerTexture,
      transparent: true,
      opacity: 1,
      side: THREE.FrontSide,
      depthTest: false,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const labelFront = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), baseLabelMat.clone());
    labelFront.position.set(0, height / 2 + 0.02, 0);
    labelFront.rotation.x = Math.PI / 2;
    labelFront.renderOrder = 10;
    rulerMesh.add(labelFront);

    const labelBack = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), baseLabelMat.clone());
    labelBack.position.set(0, -height / 2 - 0.02, 0);
    labelBack.rotation.x = -Math.PI / 2;
    labelBack.scale.x = -1; // flip to keep text正向显示
    labelBack.renderOrder = 10;
    rulerMesh.add(labelBack);

    // 中间微弱雾化层，增加前后分层感
    const gapPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.98, depth * 0.98),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      }),
    );
    gapPlane.position.set(0, 0, 0);
    gapPlane.rotation.x = Math.PI / 2;
    gapPlane.renderOrder = 5;
    rulerMesh.add(gapPlane);

    // Animate & resize
    let frameId;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    // Material switch
    const applyMaterial = (type) => {
      gsap.to(rulerMesh.rotation, { y: rulerMesh.rotation.y + Math.PI, duration: 1, ease: 'power2.inOut' });
      const matList = Array.isArray(rulerMesh.material) ? rulerMesh.material : [rulerMesh.material];
      matList.forEach((m) => m.dispose?.());
      rulerMesh.material = makeMaterial(type);
      // 切换材质时，贴图平面保持不变，只更新纹理
    };
    applyMaterial(preset.id);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      container.innerHTML = '';
    };
  }, [preset]);

  return (
    <div className={shellClass}>
      {/* Scoped styles for this viewer only */}
      <style>{`
        .${shellClass} {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #F3F4F6;
        }
        .${canvasClass} { width: 100%; height: 100%; }
        .${instructionClass} {
          position: absolute; top: 40px; width: 100%; text-align: center;
          color: #9CA3AF; font-size: 12px; pointer-events: none; letter-spacing: 2px; font-weight: 600;
        }
        .${overlayClass} {
          position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 12px; background: rgba(255,255,255,0.95);
          padding: 12px 24px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          backdrop-filter: blur(10px); pointer-events: auto; align-items: center; white-space: nowrap;
        }
        .${btnClass} {
          padding: 8px 16px; border-radius: 8px; border: 1px solid #E5E7EB;
          background: #fff; font-size: 13px; font-weight: 600; color: #374151;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
        }
        .${btnClass}:hover { background: #F9FAFB; border-color: #D1D5DB; transform: translateY(-1px); }
        .${btnClass}.${activeClass} { background: #111827; color: #fff; border-color: #111827; }
        .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; border:1px solid rgba(0,0,0,0.1); }
        .label { font-size: 12px; color: #9CA3AF; font-weight: 500; margin-right: 8px; text-transform: uppercase; }
      `}</style>

      <div className={instructionClass}>INTERACTIVE RULER • DRAG TO ROTATE</div>
      <div className={canvasClass} ref={canvasRef} />
      <div className={overlayClass}>
        <span className="label">Material</span>
        {MATERIALS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`${btnClass} ${preset.id === m.id ? activeClass : ''}`}
            onClick={() => setPreset(m)}
          >
            <span className="dot" style={{ background: m.dot }} /> {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RulerViewer;
