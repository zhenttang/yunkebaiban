import * as THREE from 'three';

// 笔 (保持不变，已经是独立模块)
export const createPen = (options = {}) => {
  const {
    accent = 0x2563eb,
    bodyColor = 0x202020,
    gripColor = 0x151515,
    metalColor = 0xcccccc,
    nibColor = 0x111111,
    flatShading = true,
  } = options;

  const g = new THREE.Group();

  const matBody = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5, flatShading });
  const matGrip = new THREE.MeshStandardMaterial({ color: gripColor, roughness: 0.8, bumpScale: 0.02 });
  const matMetal = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.3, metalness: 0.8 });
  const matNib = new THREE.MeshStandardMaterial({ color: nibColor, roughness: 0.9 });
  const matLight = new THREE.MeshBasicMaterial({ color: accent });

  const nibTipGeo = new THREE.CylinderGeometry(0.015, 0.005, 0.05, 8);
  nibTipGeo.translate(0, 0.025, 0);
  g.add(new THREE.Mesh(nibTipGeo, matNib));

  const nibConeGeo = new THREE.CylinderGeometry(0.08, 0.015, 0.25, 16);
  nibConeGeo.translate(0, 0.05 + 0.125, 0);
  const nibCone = new THREE.Mesh(nibConeGeo, matMetal);
  nibCone.castShadow = true;
  g.add(nibCone);

  const ferruleGeo = new THREE.CylinderGeometry(0.2, 0.08, 0.4, 32);
  ferruleGeo.translate(0, 0.3 + 0.2, 0);
  const ferrule = new THREE.Mesh(ferruleGeo, matMetal);
  ferrule.castShadow = true;
  g.add(ferrule);

  // Grip lowered to close gap with ferrule
  const gripGeo = new THREE.CylinderGeometry(0.21, 0.2, 1.8, 32);
  gripGeo.translate(0, 1.6, 0);
  const grip = new THREE.Mesh(gripGeo, matGrip);
  grip.castShadow = true;
  g.add(grip);

  const ringGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.04, 32);
  ringGeo.translate(0, 2.7 + 0.02, 0);
  g.add(new THREE.Mesh(ringGeo, matLight));

  const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 4.5, 6);
  bodyGeo.translate(0, 2.74 + 2.25, 0);
  const body = new THREE.Mesh(bodyGeo, matBody);
  body.castShadow = true;
  g.add(body);

  const clipStemGeo = new THREE.BoxGeometry(0.06, 0.4, 0.15);
  clipStemGeo.translate(0.2, 6.5, 0);
  g.add(new THREE.Mesh(clipStemGeo, matMetal));

  const clipArmGeo = new THREE.BoxGeometry(0.04, 2.5, 0.08);
  clipArmGeo.translate(0.25, 5.5, 0);
  g.add(new THREE.Mesh(clipArmGeo, matMetal));

  const capGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.3, 32);
  capGeo.translate(0, 6.99 + 0.15, 0);
  g.add(new THREE.Mesh(capGeo, matMetal));

  g.rotation.order = 'YXZ';
  return g;
};

// 橡皮：高保真版 (Ported from EraserViewer)
export const createEraserSystem = () => {
  const g = new THREE.Group();

  // 1. Rubber (Physical Material for translucency)
  const rubber = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1.2, 1.8),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      transmission: 0.05,
      thickness: 1.0
    })
  );
  rubber.castShadow = true;
  rubber.receiveShadow = true;
  g.add(rubber);

  // 2. Sleeve (Canvas Texture)
  const canvas = document.createElement('canvas');
  canvas.width = 1024; // High Res
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  // texture.anisotropy will be set by renderer usually, but here we just create it.

  // Initial Draw (Placeholder, LandingDesktop will overwrite or we can provide a helper)
  ctx.fillStyle = '#F9FAFB';
  ctx.fillRect(0, 0, 1024, 512);
  texture.needsUpdate = true;

  const sleeveGeo = new THREE.BoxGeometry(3.0, 1.23, 1.83);
  const sleeveMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    bumpMap: texture,
    bumpScale: 0.002
  });
  const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
  sleeve.position.x = -0.3;
  sleeve.castShadow = true;
  sleeve.receiveShadow = true;
  g.add(sleeve);

  return { eraser: g, eraserTextureCtx: ctx, eraserTexture: texture };
};

// 尺子：高保真版 (Ported from RulerViewer - Frost Preset)
export const createRuler = (options = {}) => {
  const {
    accent = 0x2563eb, // Not used in texture but kept for API compatibility
  } = options;

  const width = 8;
  const height = 0.15;
  const depth = 1.5;
  const geometry = new THREE.BoxGeometry(width, height, depth);

  // Texture generation
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Draw Frost Style (Dark ticks on transparent/light bg)
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Light background strip for numbers
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, h - 240, w, 240);

  ctx.fillStyle = '#111827'; // Dark ticks
  const startX = 100;
  const endX = w - 100;
  const totalUnits = 20;
  const step = (endX - startX) / totalUnits;

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
  ctx.fillText('云科', 0, 0);
  ctx.font = '40px "Inter"';
  ctx.globalAlpha = 0.7;
  ctx.fillText('精密标尺', 0, 80);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Material (Frost)
  const material = new THREE.MeshPhysicalMaterial({
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

  const rulerMesh = new THREE.Mesh(geometry, material);
  rulerMesh.castShadow = true;
  rulerMesh.receiveShadow = true;

  // Label Planes (Front and Back)
  const baseLabelMat = new THREE.MeshBasicMaterial({
    map: texture,
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
  labelFront.rotation.x = -Math.PI / 2; // Face upward for top view
  labelFront.renderOrder = 10;
  rulerMesh.add(labelFront);

  // Gap Plane
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

  return rulerMesh;
};

// 标签：高保真版 (Ported from TagViewer)
export const createTag = (options = {}) => {
  const { accent = 0x2563eb, opacity = 0.8 } = options;
  const g = new THREE.Group();

  // Geometry
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

  // Grommets
  const grommetGeo = new THREE.TorusGeometry(holeRadius, 0.06, 16, 32);
  const grommetMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 1.0 });
  const grommet1 = new THREE.Mesh(grommetGeo, grommetMat);
  grommet1.position.set(-width / 2 + 0.2, 0, depth / 2 + 0.02);
  g.add(grommet1);
  const grommet2 = new THREE.Mesh(grommetGeo, grommetMat);
  grommet2.position.set(-width / 2 + 0.2, 0, -depth / 2 - 0.02);
  g.add(grommet2);

  // Label Texture
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024;
  labelCanvas.height = 512;
  const ctx = labelCanvas.getContext('2d');

  // Helper to draw rounded rect
  const roundRect = (c, x, y, rw, rh, rr) => {
    if (rw < 2 * rr) rr = rw / 2;
    if (rh < 2 * rr) rr = rh / 2;
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + rw, y, x + rw, y + rh, rr);
    c.arcTo(x + rw, y + rh, x, y + rh, rr);
    c.arcTo(x, y + rh, x, y, rr);
    c.arcTo(x, y, x + rw, y, rr);
    c.closePath();
  };

  const drawTagPill = (c, text, x, y, bg, fg) => {
    c.font = 'bold 50px "Noto Sans SC", sans-serif';
    const textWidth = c.measureText(text).width;
    const pad = 40;
    const hh = 80;
    c.fillStyle = bg;
    roundRect(c, x, y, textWidth + pad * 2, hh, hh / 2);
    c.fill();
    c.fillStyle = fg;
    c.fillText(text, x + pad, y + 55);
  };

  // Draw Default Label
  const wC = 1024;
  const hC = 512;
  ctx.clearRect(0, 0, wC, hC);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  roundRect(ctx, 0, 0, wC, hC, 40);
  ctx.fill();

  // Accent Strip
  ctx.fillStyle = '#' + accent.toString(16).padStart(6, '0'); // Use accent color
  roundRect(ctx, 0, 0, 60, hC, 40);
  ctx.fill();
  ctx.fillRect(30, 0, 30, hC);

  ctx.font = 'bold 60px "Noto Sans SC", sans-serif';
  ctx.fillStyle = '#9CA3AF';
  ctx.textAlign = 'left';
  ctx.fillText('云科数据中心', 100, 100);

  ctx.font = 'bold 140px "Ma Shan Zheng", serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('高优先级', 100, 250); // Default text

  drawTagPill(ctx, '研发', 100, 360, '#E5E7EB', '#374151');
  drawTagPill(ctx, '第四季度', 300, 360, '#E5E7EB', '#374151');
  drawTagPill(ctx, 'v2.0', 620, 360, '#' + accent.toString(16).padStart(6, '0'), '#FFFFFF');

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.anisotropy = 4;

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
