import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hud from './Hud';
import StoryLayer from './StoryLayer';
import { createPen, createEraserSystem, createRuler, createTag } from './three/objects';

gsap.registerPlugin(ScrollTrigger);

const FEATURE_CARDS = [
  {
    id: 'card-1',
    align: 'left',
    dark: false,
    headline: 'Reinventing\nThe Canvas.',
    subtext: 'Traditional whiteboards are static.\nWe built a living workspace where every tool is an intelligent engine.',
  },
  {
    id: 'card-2',
    align: 'right',
    dark: false,
    tag: 'Flow Engine™ 2.0',
    headline: 'Zero Latency.\nFluid Thought.',
    subtext: 'Not just a pixel brush. Our Zero-G Pen uses physics simulation to stabilize your handwriting.',
  },
  {
    id: 'card-3',
    align: 'left',
    dark: false,
    tag: 'Semantic Erase',
    headline: 'Personalized\nTools.',
    subtext: 'Even the humblest eraser has a soul. Watch as we laser-etch your identity onto the digital sleeve.',
  },
  {
    id: 'card-4',
    align: 'center',
    dark: false,
    tag: 'Intelligent Alignment',
    headline: 'Order from Chaos.',
    subtext: 'The Bridge System acts as an invisible grid that snaps your ideas into perfect perspective.',
  },
  {
    id: 'card-5',
    align: 'left',
    dark: true,
    tag: 'Knowledge Graph',
    headline: 'Turn Sketches\nInto Data.',
    subtext: 'With Braille-Tags, every note has memory. Visualize deadlines and priority directly on the canvas.',
  },
  {
    id: 'card-6',
    align: 'center',
    dark: true,
    headline: 'Limitless.',
    subtext: 'The complete toolkit for modern thinkers.',
    cta: 'Start Free Trial ->',
  },
];

const LandingMobile = () => {
  const canvasRef = useRef(null);
  const spacerRef = useRef(null);
  const cardRefs = useRef([]);
  const iconRefs = useRef([]);

  useEffect(() => {
    document.body.classList.remove('dark-mode');
    document.body.style.backgroundColor = '';

    const container = canvasRef.current;
    const spacer = spacerRef.current;
    const cards = cardRefs.current;
    const icons = iconRefs.current;

    if (!container || cards.length === 0) return undefined;

    const CONFIG = {
      bgLight: 0xf3f4f6,
      accent: 0x2563eb,
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.bgLight);
    scene.fog = new THREE.FogExp2(CONFIG.bgLight, 0.015);

    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    const updateCameraPos = () => {
      const isMobile = window.innerWidth < 768;
      camera.position.set(0, 15, isMobile ? 45 : 35);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.width = 1024;
    renderer.shadowMap.height = 1024;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    const blueLight = new THREE.PointLight(CONFIG.accent, 0.5);
    blueLight.position.set(-10, 5, -10);
    scene.add(blueLight);

    const gridTex = new THREE.CanvasTexture(
      (() => {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const x = c.getContext('2d');
        x.fillStyle = 'transparent';
        x.fillRect(0, 0, 64, 64);
        x.fillStyle = '#CBD5E1';
        x.beginPath();
        x.arc(32, 32, 2, 0, Math.PI * 2);
        x.fill();
        return c;
      })(),
    );
    gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
    gridTex.repeat.set(100, 100);
    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.5 }),
    );
    grid.rotation.x = -Math.PI / 2;
    scene.add(grid);

    const curvePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3, 0.05, -2),
      new THREE.Vector3(-1.5, 0.05, -0.5),
      new THREE.Vector3(0, 0.05, -2),
      new THREE.Vector3(2, 0.05, 0),
      new THREE.Vector3(4, 0.05, -1),
    ]);
    const drawnCurve = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curvePath.getPoints(100)),
      new THREE.LineBasicMaterial({ color: CONFIG.accent, linewidth: 3 }),
    );
    drawnCurve.geometry.setDrawRange(0, 0);
    scene.add(drawnCurve);

    const linePath = new THREE.LineCurve3(new THREE.Vector3(-4, 0.05, 1), new THREE.Vector3(4, 0.05, 1));
    const straightLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePath.getPoints(50)),
      new THREE.LineBasicMaterial({ color: CONFIG.accent, linewidth: 3 }),
    );
    straightLine.geometry.setDrawRange(0, 0);
    scene.add(straightLine);

    const pen = createPen({ accent: CONFIG.accent, flatShading: false, bodyColor: 0x1e293b, gripColor: 0x0f172a, metalColor: 0xf8fafc });
    scene.add(pen);

    const { eraser, eraserTextureCtx, eraserTexture } = createEraserSystem();
    scene.add(eraser);

    const ruler = createRuler({ accent: CONFIG.accent, showNumbers: true, numberOpacity: 1 });
    scene.add(ruler);

    const tag = createTag({ accent: CONFIG.accent, opacity: 0.85 });
    scene.add(tag);

    const activateIcon = (index) => {
      icons.forEach((icon, i) => {
        if (!icon) return;
        if (index === -1) icon.classList.remove('active');
        else icon.classList.toggle('active', i === index);
      });
    };

    const updateEraserText = (progress) => {
      if (!eraserTextureCtx) return;
      eraserTextureCtx.fillStyle = '#f4f4f4';
      eraserTextureCtx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 200; i += 1) {
        eraserTextureCtx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
        eraserTextureCtx.fillRect(Math.random() * 512, Math.random() * 256, 2, 2);
      }
      eraserTextureCtx.strokeStyle = '#e0e0e0';
      eraserTextureCtx.strokeRect(0, 0, 512, 256);

      const revealWidth = progress * 512;
      eraserTextureCtx.save();
      eraserTextureCtx.beginPath();
      eraserTextureCtx.rect(0, 0, revealWidth, 256);
      eraserTextureCtx.clip();

      eraserTextureCtx.translate(256, 128);
      eraserTextureCtx.font = '100px "Ma Shan Zheng", cursive';
      eraserTextureCtx.textAlign = 'center';
      eraserTextureCtx.textBaseline = 'middle';
      eraserTextureCtx.fillStyle = '#333';
      eraserTextureCtx.shadowColor = 'rgba(0,0,0,0.2)';
      eraserTextureCtx.shadowBlur = 4;
      eraserTextureCtx.fillText('云科', 0, 0);
      eraserTextureCtx.restore();

      eraserTexture.needsUpdate = true;
    };

    pen.position.set(0, 30, 0);
    pen.rotation.set(Math.PI / 2, 0, 0);
    eraser.position.set(0, 30, 0);
    ruler.position.set(0, 30, 0);
    tag.position.set(0, 30, 0);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    });

    const penState = { progress: 0 };
    const writeState = { p: 0 };

    tl.to(cards[0], { opacity: 1, y: 0, duration: 2 }).to(cards[0], { opacity: 0, y: -50, duration: 2 }, '+=1');
    tl.call(() => activateIcon(0))
      .to(pen.position, { x: -3, y: 2, z: -1, duration: 2 })
      .to(pen.rotation, { x: Math.PI / 3.5, y: Math.PI, z: -Math.PI / 6, duration: 2 }, '<')
      .to(cards[1], { opacity: 1, y: 0, duration: 2 }, '-=1')
      .to(pen.position, { y: 0.0, duration: 0.5 })
      .to(penState, {
        progress: 1,
        duration: 4,
        ease: 'none',
        onUpdate: () => {
          const p = penState.progress;
          const point = curvePath.getPoint(p);
          const t = curvePath.getTangent(p);
          const yaw = Math.atan2(t.x, t.z);
          pen.position.set(point.x, point.y + 0.02, point.z);
          pen.rotation.set(Math.PI / 3.5, yaw + Math.PI, -Math.PI / 6);
          drawnCurve.geometry.setDrawRange(0, Math.floor(p * 100));
        },
      })
      .to(pen.position, { y: 30, duration: 2 })
      .to(cards[1], { opacity: 0, y: -50, duration: 2 }, '<');

    tl.call(() => activateIcon(1))
      .call(() => updateEraserText(0))
      .to(eraser.position, { x: 0, y: 1.5, z: 0, duration: 2 }, '-=1')
      .to(eraser.rotation, { x: Math.PI / 4, y: 0, z: 0, duration: 2 }, '<')
      .to(cards[2], { opacity: 1, y: 0, duration: 2 })
      .to(pen.position, { x: -1.5, y: 2.5, z: 0.8, duration: 1.5 })
      .to(pen.rotation, { x: Math.PI / 3.5, y: Math.PI / 2, z: -Math.PI / 6, duration: 1 }, '<')
      .to(writeState, {
        p: 1,
        duration: 4,
        ease: 'none',
        onUpdate: () => {
          const progress = writeState.p;
          updateEraserText(progress);
          const writeX = -1.0 + progress * 2.5;
          const writeZ = Math.sin(progress * 30) * 0.2;
          pen.position.set(writeX + 0.5, 2.2, writeZ + 0.5);
          pen.rotation.set(Math.PI / 3.5 + Math.sin(progress * 40) * 0.1, Math.PI / 2, -Math.PI / 6);
        },
      })
      .to(pen.position, { y: 30, duration: 1 })
      .to(eraser.rotation, { x: 0, y: 0, z: Math.PI / 3, duration: 0.5 })
      .to(eraser.position, { x: -1, y: 1.8, z: -0.5, duration: 0.5 }, '<')
      .to(eraser.position, { x: 1, y: 1.85, z: 0.5, duration: 0.2, yoyo: true, repeat: 5, ease: 'power1.inOut' })
      .to(drawnCurve.material, { opacity: 0, duration: 1.0 }, '<')
      .to(eraser.position, { y: 30, duration: 2 })
      .to(cards[2], { opacity: 0, y: -50, duration: 2 }, '<');

    tl.call(() => activateIcon(2))
      .to(ruler.position, { x: 0, y: 0.2, z: 0, duration: 2 })
      .to(cards[3], { opacity: 1, y: 0, duration: 2 })
      .to(grid.material, { opacity: 0.6, duration: 2 }, '<')
      .set(pen.position, { x: -4.5, y: 2, z: 1.5 })
      .set(pen.rotation, { x: Math.PI / 3.5, y: Math.PI / 2, z: -Math.PI / 6 })
      .to(pen.position, { y: 0.05, duration: 1 })
      .to(
        pen.position,
        {
          x: 4.5,
          duration: 3,
          ease: 'power1.inOut',
          onUpdate() {
            straightLine.geometry.setDrawRange(0, Math.floor(this.progress() * 50));
          },
        },
      )
      .to([ruler.position, pen.position], { y: 30, duration: 2 })
      .to(cards[3], { opacity: 0, y: -50, duration: 2 }, '<');

    tl.call(() => activateIcon(3))
      .to(document.body, { backgroundColor: '#0B0C0E', duration: 2 })
      .to(document.body, { className: 'dark-mode' }, '<')
      .to(scene.fog.color, { r: 0.04, g: 0.04, b: 0.05, duration: 2 }, '<')
      .to(scene.background, { r: 0.04, g: 0.04, b: 0.05, duration: 2 }, '<')
      .to(grid.material, { opacity: 0.05, duration: 2 }, '<')
      .to(tag.position, { x: 0, y: 2, z: 0, duration: 2 }, '-=1')
      .to(cards[4], { opacity: 1, y: 0, duration: 2 })
      .to(tag.rotation, { y: Math.PI * 2, duration: 8, ease: 'none' }, '<')
      .to(cards[4], { opacity: 0, y: -50, duration: 1 }, '+=2')
      .to(cards[5], { opacity: 1, y: 0, duration: 1 })
      .call(() => activateIcon(-1))
      .to(pen.position, { x: -5, y: 2, z: 0, duration: 2 }, '<')
      .to(pen.rotation, { x: Math.PI / 4, y: 0, z: Math.PI / 4, duration: 2 }, '<')
      .to(eraser.position, { x: 5, y: 2, z: 0, duration: 2 }, '<')
      .to(eraser.rotation, { x: Math.PI / 4, y: -0.5, z: 0, duration: 2 }, '<')
      .to(ruler.position, { x: 0, y: -2, z: 2, duration: 2 }, '<')
      .to(ruler.rotation, { x: -Math.PI / 6, y: 0, z: 0, duration: 2 }, '<');

    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
      const time = clock.getElapsedTime();
      if (pen.position.y < 5 && pen.position.y > 0.1) pen.position.y += Math.sin(time * 3) * 0.0005;
      if (eraser.position.y < 20) eraser.position.y += Math.cos(time * 2.5) * 0.001;
      if (tag.position.y < 20) tag.position.y += Math.sin(time * 3) * 0.001;
      if (ruler.position.y < 20) ruler.position.y += Math.cos(time * 1.5) * 0.001;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateCameraPos();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      renderer.dispose();
      renderer.forceContextLoss?.();
      container.innerHTML = '';
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('dark-mode');
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="app-shell">
      <Hud iconRefs={iconRefs} downloadLabel="Get App" />
      <div id="canvas-container" ref={canvasRef} />
      <StoryLayer cards={FEATURE_CARDS} cardRefs={cardRefs} />
      <div className="scroll-spacer" ref={spacerRef} />
    </div>
  );
};

export default LandingMobile;
