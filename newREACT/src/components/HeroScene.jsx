import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { createPen, createEraserSystem, createRuler, createTag } from './three/objects';

const HeroScene = () => {
  const canvasRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const container = canvasRef.current;
    const textEl = textRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 25);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new THREE.Scene();
    const boxGeo = new THREE.BoxGeometry(10, 10, 10);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    roomEnv.add(new THREE.Mesh(boxGeo, boxMat));
    const topLight = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    );
    topLight.position.set(0, 4.9, 0);
    topLight.rotation.x = Math.PI / 2;
    roomEnv.add(topLight);
    const sideLight = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 8),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide }),
    );
    sideLight.position.set(-4.9, 0, 0);
    sideLight.rotation.y = Math.PI / 2;
    roomEnv.add(sideLight);
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.radius = 4;
    scene.add(mainLight);
    const fillLight = new THREE.DirectionalLight(0xddeeff, 1.0);
    fillLight.position.set(-5, 2, 2);
    scene.add(fillLight);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.ShadowMaterial({ opacity: 0.15, color: 0x0f172a }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -4;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const createDotGrid = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.arc(32, 32, 2, 0, Math.PI * 2);
      ctx.fill();
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(40, 40);
      const geo = new THREE.PlaneGeometry(200, 200);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.4 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -4.1;
      return mesh;
    };
    scene.add(createDotGrid());

    const heroGroup = new THREE.Group();
    scene.add(heroGroup);
    heroGroup.position.set(5, 0, 0);

    const pen = createPen({
      accent: 0x3b82f6,
      bodyColor: 0x1e293b,
      gripColor: 0x0f172a,
      metalColor: 0xf8fafc,
      nibColor: 0x111111,
      flatShading: false,
    });
    heroGroup.add(pen);

    const rulerGroup = createRuler({
      accent: 0xffffff,
      glassColor: 0x3b82f6,
      transmission: 0.5,
      opacity: 0.9,
      roughness: 0.1,
      metalness: 0.1,
      thickness: 1.5,
      clearcoat: 1,
    });
    rulerGroup.children?.forEach((child) => {
      if (child.material?.transparent === undefined) return;
      // Already configured via createRuler options.
    });
    heroGroup.add(rulerGroup);

    const { eraser: eraserGroup, eraserTextureCtx, eraserTexture } = createEraserSystem();
    eraserTextureCtx.fillStyle = '#334155';
    eraserTextureCtx.fillRect(0, 0, 512, 256);
    eraserTextureCtx.fillStyle = '#FFFFFF';
    eraserTextureCtx.font = '100px "Ma Shan Zheng"';
    eraserTextureCtx.textAlign = 'center';
    eraserTextureCtx.textBaseline = 'middle';
    eraserTextureCtx.fillText('云科', 256, 128);
    eraserTexture.needsUpdate = true;
    heroGroup.add(eraserGroup);

    const tagGroup = createTag({ accent: 0x2563eb, opacity: 0.9 });
    tagGroup.scale.set(0.7, 0.7, 0.7);
    heroGroup.add(tagGroup);

    pen.position.set(0, 0, 2);
    pen.rotation.set(Math.PI / 4, -Math.PI / 6, -Math.PI / 4);
    rulerGroup.position.set(-1, -2.5, -2);
    rulerGroup.rotation.set(Math.PI / 6, Math.PI / 12, -Math.PI / 12);
    eraserGroup.position.set(2.5, -4, 1);
    eraserGroup.rotation.set(Math.PI / 8, -Math.PI / 4, 0.1);
    tagGroup.position.set(2, 3, -2);
    tagGroup.rotation.set(0.1, -0.3, 0.1);

    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
      const t = clock.getElapsedTime();
      pen.position.y = Math.sin(t * 0.5) * 0.2;
      pen.rotation.z = -Math.PI / 4 + Math.sin(t * 0.3) * 0.05;
      rulerGroup.position.y = -2.5 + Math.sin(t * 0.4 + 1) * 0.15;
      rulerGroup.rotation.x = Math.PI / 6 + Math.sin(t * 0.2) * 0.02;
      eraserGroup.position.y = -4 + Math.sin(t * 0.6 + 2) * 0.1;
      tagGroup.position.y = 3 + Math.sin(t * 0.5) * 0.2;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    gsap.from(heroGroup.position, { x: 10, duration: 2.5, ease: 'power3.out' });
    if (textEl) gsap.from(textEl, { y: 30, opacity: 0, duration: 1.5, delay: 0.5, ease: 'power2.out' });
    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (width < 768) {
        heroGroup.position.set(0, 1, -4);
        heroGroup.scale.set(0.6, 0.6, 0.6);
      } else {
        heroGroup.position.set(5, 0, 0);
        heroGroup.scale.set(1, 1, 1);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      renderer.forceContextLoss?.();
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="hero-shell">
      <div className="ui-layer">
        <nav className="navbar">
          <div className="brand">
            <div className="brand-dot" />
            LIMITLESS
          </div>
          <div className="navbar-version">v2.0</div>
        </nav>
        <div className="hero-content">
          <div className="text-container" ref={textRef}>
            <div className="tag-pill">Flow Engine v2.0</div>
            <h1>
              Thinking,<br />
              <span className="hero-muted">Unbound.</span>
            </h1>
            <p className="hero-desc">
              Break free from static whiteboards. Limitless is a spatial workspace that turns your chaotic sketches into structured knowledge.
            </p>
            <button className="btn-primary" type="button">
              Get Started Free
            </button>
          </div>
        </div>
      </div>
      <div className="hero-canvas" ref={canvasRef} />
    </div>
  );
};

export default HeroScene;
