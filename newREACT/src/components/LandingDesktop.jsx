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
    subtext:
      'Traditional whiteboards are static.\nWe built a living workspace where every tool is an intelligent engine.',
  },
  {
    id: 'card-2',
    align: 'right',
    dark: false,
    tag: 'Flow Engine™ 2.0',
    headline: 'Zero Latency.\nFluid Thought.',
    subtext: 'Not just a pixel brush. Our Zero-G Pen uses physics simulation to stabilize your handwriting in real-time.',
  },
  {
    id: 'card-3',
    align: 'left',
    dark: false,
    tag: 'Semantic Erase',
    headline: 'Personalized\nTools.',
    subtext: 'Even the humblest eraser has a soul. Watch as we laser-etch your identity onto the digital sleeve in real-time.',
  },
  {
    id: 'card-4',
    align: 'center',
    dark: false,
    tag: 'Intelligent Alignment',
    headline: 'Order from Chaos.',
    subtext: 'The Bridge System acts as an invisible grid that snaps your ideas into perfect perspective.',
    style: { bottom: '15%', top: 'auto' },
    annotation: 'Auto-Snap!',
  },
  {
    id: 'card-5',
    align: 'left',
    dark: false,
    tag: 'Knowledge Graph',
    headline: 'Turn Sketches\nInto Data.',
    subtext: 'With Braille-Tags, every note has memory. Visualize deadlines and priority directly on the canvas.',
    style: { bottom: '15%', top: 'auto' },
    annotation: 'Smart Tags',
  },
  {
    id: 'card-6',
    align: 'center',
    dark: false,
    headline: 'Limitless.',
    subtext: 'The complete toolkit for modern thinkers.',
    cta: 'Start Free Trial ->',
    style: { bottom: '15%', top: 'auto' },
    annotation: 'Join Now',
  },
];

const LandingDesktop = () => {
  const canvasRef = useRef(null);
  const spacerRef = useRef(null);
  const cardRefs = useRef([]);
  const iconRefs = useRef([]);
  const cursorRef = useRef(null);

  useEffect(() => {
    // Reset body theme on mount.
    document.body.classList.remove('dark-mode');
    document.body.style.backgroundColor = '';

    const container = canvasRef.current;
    const spacer = spacerRef.current;
    const cursor = cursorRef.current;
    const cards = cardRefs.current;
    const icons = iconRefs.current;

    if (!container || cards.length === 0) return undefined;

    const CONFIG = {
      bgLight: 0xffffff,
      bgDark: 0x0b0c0e,
      gridColor: 0xcbd5e1, // Cooler, slightly darker gray for contrast against gradient
      accent: 0x2563eb,
      charcoal: 0x374151,
      eraserBody: 0xffffff,
      eraserSleeve: 0xeeeeee,
    };

    const scene = new THREE.Scene();
    // Transparent background to let CSS gradient show through
    scene.background = null;
    // Fog matches the outer edge of the gradient (#f1f5f9)
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.015);

    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Use native device pixel ratio for maximum sharpness
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // PBR & Environment Settings
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Apply Radial Gradient Background
    container.style.background = 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 100%)';
    container.appendChild(renderer.domElement);

    // Environment Map for Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new THREE.Scene();
    roomEnv.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })));
    const topLight = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    topLight.position.set(0, 4.9, 0);
    topLight.rotation.x = Math.PI / 2;
    roomEnv.add(topLight);
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const blueLight = new THREE.PointLight(CONFIG.accent, 0.5);
    blueLight.position.set(-10, 5, -10);
    scene.add(blueLight);

    // --- Living Grid System ---
    const createLivingGrid = () => {
      const geometry = new THREE.PlaneGeometry(100, 100, 80, 80);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(CONFIG.gridColor) },
        },
        vertexShader: `
          uniform float uTime;
          varying float vOpacity;
          void main() {
            vec3 pos = position;
            // Gentle wave effect
            float wave = sin(pos.x * 0.1 + uTime * 0.5) * 0.5 + sin(pos.y * 0.1 + uTime * 0.3) * 0.5;
            pos.z += wave * 2.0;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = 3.0;
            
            // Fade out at edges
            float dist = length(pos.xy);
            vOpacity = 1.0 - smoothstep(20.0, 50.0, dist);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vOpacity;
          void main() {
            if (vOpacity <= 0.0) discard;
            // Circular points
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;
            
            gl_FragColor = vec4(uColor, vOpacity * 0.6); // 0.6 base opacity
          }
        `,
        transparent: true,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      points.rotation.x = -Math.PI / 2;
      points.position.y = -4; // Lower grid slightly
      return points;
    };

    const grid = createLivingGrid();
    scene.add(grid);

    // --- Ambient Particles System ---
    const createAmbientParticles = () => {
      const group = new THREE.Group();
      const particleCount = 15;
      const geometries = [
        new THREE.TetrahedronGeometry(0.2),
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.IcosahedronGeometry(0.2),
      ];
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        roughness: 0.2,
        metalness: 0.1,
        transmission: 0.5,
        transparent: true,
        opacity: 0.6,
      });

      for (let i = 0; i < particleCount; i++) {
        const geom = geometries[Math.floor(Math.random() * geometries.length)];
        const mesh = new THREE.Mesh(geom, material);

        // Random position in a wide volume
        mesh.position.set(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 20 + 5, // Keep above ground
          (Math.random() - 0.5) * 20
        );

        // Random rotation
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        // Store random animation parameters
        mesh.userData = {
          speedY: (Math.random() - 0.5) * 0.02,
          speedRot: (Math.random() - 0.5) * 0.02,
        };

        group.add(mesh);
      }
      return group;
    };

    const particles = createAmbientParticles();
    scene.add(particles);

    const curvePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3, 0.05, -2),
      new THREE.Vector3(-1.5, 0.05, -0.5),
      new THREE.Vector3(0, 0.05, -2),
      new THREE.Vector3(2, 0.05, 0),
      new THREE.Vector3(4, 0.05, -1),
    ]);
    const curvePoints = curvePath.getPoints(100);
    const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMat = new THREE.LineBasicMaterial({ color: CONFIG.accent, linewidth: 3, transparent: true, opacity: 1 });
    const drawnCurve = new THREE.Line(curveGeo, curveMat);
    drawnCurve.geometry.setDrawRange(0, 0);
    scene.add(drawnCurve);

    const linePath = new THREE.LineCurve3(new THREE.Vector3(-4, 1.0, 0), new THREE.Vector3(4, 1.0, 0)); // User-tuned: line Y/Z
    const linePoints = linePath.getPoints(50);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({ color: CONFIG.accent, linewidth: 3 });
    const straightLine = new THREE.Line(lineGeo, lineMat);
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
        if (index === -1) {
          icon.classList.remove('active');
        } else {
          icon.classList.toggle('active', i === index);
        }
      });
    };

    const updateEraserText = (progress) => {
      if (!eraserTextureCtx) return;
      const w = 1024;
      const h = 512;

      // Clear and redraw background (Simple noise to match clean look)
      eraserTextureCtx.fillStyle = '#f4f4f4';
      eraserTextureCtx.fillRect(0, 0, w, h);

      // Add some noise
      for (let i = 0; i < 400; i += 1) {
        eraserTextureCtx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
        eraserTextureCtx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
      eraserTextureCtx.strokeStyle = '#e0e0e0';
      eraserTextureCtx.lineWidth = 8;
      eraserTextureCtx.strokeRect(0, 0, w, h);

      const revealWidth = progress * w;
      eraserTextureCtx.save();
      eraserTextureCtx.beginPath();
      // Reveal from Left to Right on texture (which is now Left to Right in World)
      eraserTextureCtx.rect(0, 0, revealWidth, h);
      eraserTextureCtx.clip();

      eraserTextureCtx.translate(w / 2, h / 2);
      eraserTextureCtx.font = '200px "Ma Shan Zheng", cursive'; // Doubled font size
      eraserTextureCtx.textAlign = 'center';
      eraserTextureCtx.textBaseline = 'middle';
      eraserTextureCtx.fillStyle = '#333';
      eraserTextureCtx.shadowColor = 'rgba(0,0,0,0.2)';
      eraserTextureCtx.shadowBlur = 8;
      eraserTextureCtx.fillText('云科', 0, 0);
      eraserTextureCtx.restore();

      eraserTexture.needsUpdate = true;
    };

    // --- Initial Hero Positions (Floating Assembly) ---
    // Pen: Angled on the right
    pen.position.set(8, 0, 2);
    pen.rotation.set(0, 0, -Math.PI / 4);

  // Ruler: Horizontal on the left
  ruler.position.set(-8, 2, 0);
  ruler.rotation.set(Math.PI / 6, 0, 0);

    // Eraser: Floating bottom left
    eraser.position.set(-5, -4, 2);
    eraser.rotation.set(Math.PI / 4, -0.2, 0); // Removed flip Y

    // Tag: Floating top center
    tag.position.set(2, 5, -2);
    tag.rotation.set(0, -0.2, 0.1);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    });

    // Scene 1: Pen Feature (Transition from Hero)
    tl.to(cards[0], { opacity: 1, y: 0, duration: 2 })
      .to(cards[0], { opacity: 0, y: -50, duration: 2 }, '+=1');

    const penState = { progress: 0 };
    tl.call(() => activateIcon(0))
      // Move Pen to center for feature showcase
      .to(pen.position, { x: -3, y: 2, z: -1, duration: 2 })
      .to(pen.rotation, { x: Math.PI / 3.5, y: Math.PI, z: -Math.PI / 6, duration: 2 }, '<')
      // Move others away
      .to(ruler.position, { x: -15, y: 10, duration: 2 }, '<')
      .to(eraser.position, { x: -15, y: -10, duration: 2 }, '<')
      .to(tag.position, { x: 15, y: 10, duration: 2 }, '<')
      .to(cards[1], { opacity: 1, y: 0, duration: 2 }, '-=1')
      .to(pen.position, { y: 0.0, duration: 0.5 })
      .to(penState, {
        progress: 1,
        duration: 4,
        ease: 'none',
        onUpdate: () => {
          const p = penState.progress;
          const point = curvePath.getPoint(p);
          pen.position.set(point.x, point.y + 0.02, point.z);
          const t = curvePath.getTangent(p);
          const yaw = Math.atan2(t.x, t.z);
          pen.rotation.set(Math.PI / 3.5, yaw + Math.PI, -Math.PI / 6);
          drawnCurve.geometry.setDrawRange(0, Math.floor(p * 100));
        },
      })
      .to(pen.position, { y: 30, duration: 2 })
      .to(cards[1], { opacity: 0, y: -50, duration: 2 }, '<');

    const writeState = { p: 0 };
  tl.call(() => activateIcon(1))
    .call(() => updateEraserText(0))
    .to(eraser.position, { x: 0, y: 1.5, z: 0, duration: 2 }, '-=1')
    .to(eraser.rotation, { x: Math.PI / 4, y: 0, z: -Math.PI / 6, duration: 2 }, '<') // Tilt so exposed head faces down
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
    .to(eraser.rotation, { x: 0, y: 0, z: -Math.PI / 3, duration: 0.5 })
      .to(eraser.position, { x: -1, y: 1.8, z: -0.5, duration: 0.5 }, '<')
      .to(eraser.position, { x: 1, y: 1.85, z: 0.5, duration: 0.2, yoyo: true, repeat: 5, ease: 'power1.inOut' })
      .to(drawnCurve.material, { opacity: 0, duration: 1.0 }, '<')
      .to(eraser.position, { y: 30, duration: 2 })
      .to(cards[2], { opacity: 0, y: -50, duration: 2 }, '<');

  tl.call(() => activateIcon(2))
    .to(ruler.position, { x: 0, y: 0.2, z: 0, duration: 2 })
    .to(cards[3], { opacity: 1, y: 0, duration: 2 })
    .to(grid.material, { opacity: 0.6, duration: 2 }, '<')
  .set(pen.position, { x: -4.5, y: 2, z: 0 })
    .set(pen.rotation, { x: 0.81590984938687, y: Math.PI / 2, z: -0.248798950512828 }) // User-tuned angles
    .to(pen.position, { y: 1, z: 0, duration: 1 }) // User-tuned drop position
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
      // Removed dark mode transition for infinite whiteboard effect
      .to(tag.position, { x: 0, y: 2, z: 0, duration: 2 })
      .to(cards[4], { opacity: 1, y: 0, duration: 2 })
      .to(tag.rotation, { y: Math.PI * 2, duration: 8, ease: 'none' }, '<')
      .to(cards[4], { opacity: 0, y: -50, duration: 1 }, '+=2')
      .to(cards[5], { opacity: 1, y: 0, duration: 1 })
      .call(() => activateIcon(-1))
      .to(pen.position, { x: -5, y: 2, z: 0, duration: 2 }, '<')
      .to(pen.rotation, { x: Math.PI / 4, y: 0, z: Math.PI / 4, duration: 2 }, '<')
      .to(eraser.position, { x: 5, y: 2, z: 0, duration: 2 }, '<')
      .to(eraser.rotation, { x: Math.PI / 4, y: -0.5, z: 0, duration: 2 }, '<') // Removed flip
      .to(ruler.position, { x: 0, y: -2, z: 2, duration: 2 }, '<')
    .to(ruler.rotation, { x: -Math.PI / 2.5, y: 0, z: 0, duration: 2 }, '<');

    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
      const time = clock.getElapsedTime();
      // Idle Animation for Hero State (when scroll is at top)
      const scrollY = window.scrollY;
      if (scrollY < 100) {
        pen.position.y += Math.sin(time * 2) * 0.002;
        ruler.position.y += Math.cos(time * 1.5) * 0.002;
        eraser.position.y += Math.sin(time * 2.5) * 0.002;
        tag.position.y += Math.cos(time * 2) * 0.002;

        pen.rotation.z += Math.sin(time) * 0.001;
        ruler.rotation.x += Math.cos(time) * 0.001;
      }

      if (pen.position.y < 5 && pen.position.y > 0.1 && scrollY > 100) pen.position.y += Math.sin(time * 3) * 0.0005;
      if (eraser.position.y < 20 && scrollY > 100) eraser.position.y += Math.cos(time * 2.5) * 0.001;
      if (tag.position.y < 20 && scrollY > 100) tag.position.y += Math.sin(time * 3) * 0.001;
      if (ruler.position.y < 20 && scrollY > 100) ruler.position.y += Math.cos(time * 1.5) * 0.001;

      // Animate Living Grid
      grid.material.uniforms.uTime.value = time;

      // Animate Particles
      particles.children.forEach(p => {
        p.position.y += p.userData.speedY;
        p.rotation.x += p.userData.speedRot;
        p.rotation.y += p.userData.speedRot;
        // Wrap around
        if (p.position.y > 15) p.position.y = -5;
        if (p.position.y < -5) p.position.y = 15;
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio); // Update pixel ratio on resize
    };
    const handleMouseMove = (e) => {
      if (cursor) gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.2 });
    };
    const handleEnter = () => {
      if (cursor) cursor.style.opacity = 1;
    };
    const handleLeave = () => {
      if (cursor) cursor.style.opacity = 0;
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleEnter);
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      tl.kill();
      renderer.dispose();
      renderer.forceContextLoss?.();
      container.innerHTML = '';
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleEnter);
      document.removeEventListener('mouseleave', handleLeave);
      document.body.classList.remove('dark-mode');
      document.body.style.backgroundColor = '';
  };
}, []);

return (
  <div className="app-shell">
    <div className="cursor-mockup" ref={cursorRef} />
    <Hud iconRefs={iconRefs} />
    <div id="canvas-container" ref={canvasRef} />
    <StoryLayer cards={FEATURE_CARDS} cardRefs={cardRefs} />
    <div className="scroll-spacer" ref={spacerRef} />
    </div>
  );
};

export default LandingDesktop;
