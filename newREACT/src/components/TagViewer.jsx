import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

const STATUS_PRESETS = [
  { text: '高优先级', color: '#EF4444' },
  { text: '已完成', color: '#10B981' },
  { text: '草稿', color: '#F59E0B' },
];

const TagViewer = () => {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState(STATUS_PRESETS[0]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 12);

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
    controls.autoRotateSpeed = 1.0;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new THREE.Scene();
    roomEnv.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })));
    const light1 = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    light1.position.set(0, 4.9, 0);
    light1.rotation.x = Math.PI / 2;
    roomEnv.add(light1);
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.radius = 4;
    scene.add(mainLight);
    const backLight = new THREE.SpotLight(0xffffff, 1.0);
    backLight.position.set(0, 2, -5);
    backLight.lookAt(0, 0, 0);
    scene.add(backLight);

    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.1, color: 0x111827 }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.5;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Tag construction (kept self-contained for the richer shape)
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 512;
    const labelCtx = labelCanvas.getContext('2d');
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const drawLabel = (text, color) => {
      const ctx = labelCtx;
      const w = 1024;
      const h = 512;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      roundRect(ctx, 0, 0, w, h, 40);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, 0, 0, 60, h, 40);
      ctx.fill();
      ctx.fillRect(30, 0, 30, h);
      ctx.font = 'bold 60px "Noto Sans SC", sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'left';
      ctx.fillText('云科数据中心', 100, 100);
      ctx.font = 'bold 140px "Ma Shan Zheng", serif';
      ctx.fillStyle = '#111827';
      ctx.fillText(text, 100, 250);
      drawTagPill(ctx, '研发', 100, 360, '#E5E7EB', '#374151');
      drawTagPill(ctx, '第四季度', 300, 360, '#E5E7EB', '#374151');
      drawTagPill(ctx, 'v2.0', 620, 360, color, '#FFFFFF');
      labelTexture.needsUpdate = true;
    };

    const drawTagPill = (ctx, text, x, y, bg, fg) => {
      ctx.font = 'bold 50px "Noto Sans SC", sans-serif';
      const textWidth = ctx.measureText(text).width;
      const pad = 40;
      const height = 80;
      ctx.fillStyle = bg;
      roundRect(ctx, x, y, textWidth + pad * 2, height, height / 2);
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.fillText(text, x + pad, y + 55);
    };

    const roundRect = (ctx, x, y, w, h, r) => {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const createTag = () => {
      const g = new THREE.Group();
      const width = 4;
      const height = 2.2;
      const depth = 0.2;
      const holeRadius = 0.25;
      const shape = new THREE.Shape();
      const r = 0.2;
      const w = width / 2;
      const h = height / 2;
      const pointX = -w - 0.8;
      shape.moveTo(pointX, 0);
      shape.lineTo(-w, h);
      shape.lineTo(w - r, h);
      shape.quadraticCurveTo(w, h, w, h - r);
      shape.lineTo(w, -h + r);
      shape.quadraticCurveTo(w, -h, w - r, -h);
      shape.lineTo(-w, -h);
      shape.lineTo(pointX, 0);
      const holePath = new THREE.Path();
      const holeX = -w + 0.2;
      holePath.absarc(holeX, 0, holeRadius, 0, Math.PI * 2, true);
      shape.holes.push(holePath);
      const extrudeSettings = { steps: 1, depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.center();
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.1,
        transmission: 0.6,
        thickness: 1.0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);

      const grommetGeo = new THREE.TorusGeometry(holeRadius, 0.06, 16, 32);
      const grommetMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 1.0 });
      const grommet1 = new THREE.Mesh(grommetGeo, grommetMat);
      grommet1.position.set(-width / 2 + 0.2, 0, depth / 2 + 0.02);
      g.add(grommet1);
      const grommet2 = new THREE.Mesh(grommetGeo, grommetMat);
      grommet2.position.set(-width / 2 + 0.2, 0, -depth / 2 - 0.02);
      g.add(grommet2);

      const labelGeo = new THREE.PlaneGeometry(3.2, 1.6);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, opacity: 0.9 });
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.set(0.5, 0, depth / 2 + 0.06);
      g.add(labelMesh);
      const labelMeshBack = labelMesh.clone();
      labelMeshBack.rotation.y = Math.PI;
      labelMeshBack.position.z = -depth / 2 - 0.06;
      g.add(labelMeshBack);
      return g;
    };

    const tagGroup = createTag();
    scene.add(tagGroup);

    drawLabel(status.text, status.color);

    const animate = () => {
      const t = Date.now() * 0.001;
      tagGroup.position.y = Math.sin(t) * 0.2;
      tagGroup.rotation.z = Math.sin(t * 0.5) * 0.05;
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    let frameId = requestAnimationFrame(animate);

    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    const cleanup = () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      container.innerHTML = '';
    };
    return cleanup;
  }, [status.text, status.color]);

  const handleSelect = (preset) => {
    setStatus(preset);
  };

  return (
    <div className="viewer-shell">
      <div className="instruction">INTERACTIVE TAG • DRAG TO ROTATE</div>
      <div className="viewer-canvas" ref={canvasRef} />
      <div className="ui-overlay">
        <span className="label">状态</span>
        {STATUS_PRESETS.map((preset) => (
          <button
            key={preset.text}
            type="button"
            className={`text-btn${status.text === preset.text ? ' active' : ''}`}
            onClick={() => handleSelect(preset)}
          >
            <span className="dot" style={{ background: preset.color }} />
            {preset.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagViewer;
