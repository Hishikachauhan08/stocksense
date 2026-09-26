import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Scan } from 'lucide-react';

interface Conveyor3DVisualProps {
  height?: string;
}

export const Conveyor3DVisual: React.FC<Conveyor3DVisualProps> = ({ height = '460px' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<{
    title: string;
    sku: string;
    weight: string;
    status: string;
    conveyorLine: string;
  }>({
    title: 'Industrial Steel Rods (10mm)',
    sku: 'STL-100-ROD',
    weight: '+100 kg Intake',
    status: 'Verified at Intake Dock',
    conveyorLine: 'Line 01 (Vendor Receiving)',
  });

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const heightPx = container.clientHeight || 460;

    // 1. Scene setup - Bright Elegant Studio Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.018);

    // 2. Camera setup - Isometric perspective
    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 1000);
    camera.position.set(18, 14, 20);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting - Bright, warm, elegant
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaf0, 2.2);
    sunLight.position.set(15, 25, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 1.2);
    fillLight.position.set(-15, 18, -10);
    scene.add(fillLight);

    const laserSpot = new THREE.SpotLight(0x10b981, 3, 20, Math.PI / 6, 0.5);
    laserSpot.position.set(0, 6, 0);
    laserSpot.target.position.set(0, 1.2, 0);
    scene.add(laserSpot);
    scene.add(laserSpot.target);

    // 5. Studio Floor with subtle light grid
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.7,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(50, 50, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = 0.01;
    scene.add(grid);

    // 6. Conveyor Line Structure - Elegant Titanium & Slate
    const conveyorGroup = new THREE.Group();

    const legMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.3,
    });

    [-10, -5, 0, 5, 10].forEach((xPos) => {
      const legGeo = new THREE.BoxGeometry(0.28, 1.2, 2.4);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(xPos, 0.6, 0);
      leg.castShadow = true;
      conveyorGroup.add(leg);
    });

    // Side Rails (Brushed Titanium)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.8,
      roughness: 0.25,
    });

    const railGeo = new THREE.BoxGeometry(26, 0.38, 0.14);
    const rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(0, 1.35, -1.1);
    const rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.set(0, 1.35, 1.1);
    conveyorGroup.add(rail1);
    conveyorGroup.add(rail2);

    // Warm Bronze Accent Strips along conveyor rails (Replaces cyan)
    const bronzeMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const bronzeGeo = new THREE.BoxGeometry(25.8, 0.05, 0.05);
    const bronze1 = new THREE.Mesh(bronzeGeo, bronzeMat);
    bronze1.position.set(0, 1.45, -1.05);
    const bronze2 = new THREE.Mesh(bronzeGeo, bronzeMat);
    bronze2.position.set(0, 1.45, 1.05);
    conveyorGroup.add(bronze1);
    conveyorGroup.add(bronze2);

    // Conveyor Rollers (Rotating cylinders)
    const rollers: THREE.Mesh[] = [];
    const rollerGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.1, 16);
    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.3,
    });

    for (let x = -12; x <= 12; x += 0.5) {
      const roller = new THREE.Mesh(rollerGeo, rollerMat);
      roller.rotation.x = Math.PI / 2;
      roller.position.set(x, 1.25, 0);
      conveyorGroup.add(roller);
      rollers.push(roller);
    }

    // 7. Overhead Optical Scanning Arch
    const archGroup = new THREE.Group();
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const archPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.5, 0.45), archMat);
    archPillar1.position.set(0, 2.25, -1.5);
    const archPillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.5, 0.45), archMat);
    archPillar2.position.set(0, 2.25, 1.5);

    const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 3.4), archMat);
    archTop.position.set(0, 4.3, 0);

    const sensorHead = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.35, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 })
    );
    sensorHead.position.set(0, 3.9, 0);

    // Laser Scanning Plane
    const laserPlaneGeo = new THREE.PlaneGeometry(0.04, 2.6);
    const laserPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const laserPlane = new THREE.Mesh(laserPlaneGeo, laserPlaneMat);
    laserPlane.rotation.x = Math.PI / 2;
    laserPlane.position.set(0, 1.45, 0);

    const curtainGeo = new THREE.PlaneGeometry(0.05, 2.4);
    const curtainMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const curtain = new THREE.Mesh(curtainGeo, curtainMat);
    curtain.position.set(0, 2.65, 0);

    archGroup.add(archPillar1);
    archGroup.add(archPillar2);
    archGroup.add(archTop);
    archGroup.add(sensorHead);
    archGroup.add(laserPlane);
    archGroup.add(curtain);

    conveyorGroup.add(archGroup);
    scene.add(conveyorGroup);

    // 8. Dynamic Cargo Packages on Conveyor
    const packages: Array<{
      group: THREE.Group;
      speed: number;
      startX: number;
      endX: number;
      info: { title: string; sku: string; weight: string; status: string; conveyorLine: string };
    }> = [];

    const packageTemplates = [
      {
        title: 'Industrial Steel Rods (10mm)',
        sku: 'STL-100-ROD',
        weight: '+100 kg Intake',
        status: 'Inbound Receipt #REC-2026-001',
        conveyorLine: 'Line A (Vendor Intake)',
        color: 0x059669, // Forest Emerald
        geo: new THREE.BoxGeometry(2.4, 0.7, 1.2),
      },
      {
        title: 'Reinforced Steel Frames',
        sku: 'STL-FRM-02',
        weight: '-20 units Dispatch',
        status: 'Outbound Delivery #DEL-2026-002',
        conveyorLine: 'Line B (Pick & Pack Staging)',
        color: 0xd97706, // Warm Amber
        geo: new THREE.BoxGeometry(1.8, 1.2, 1.4),
      },
      {
        title: 'Ergonomic Task Chairs (Mesh Pro)',
        sku: 'CHR-ERG-01',
        weight: '-10 units Shipped',
        status: 'Customer Shipment #DEL-2026-001',
        conveyorLine: 'Line C (Shipping Dock)',
        color: 0x7c3aed, // Refined Violet
        geo: new THREE.BoxGeometry(1.6, 1.4, 1.5),
      },
      {
        title: 'Damaged Carbon Rods (Scrap)',
        sku: 'STL-100-ROD',
        weight: '-3 kg Variance',
        status: 'Stock Adjustment #ADJ-2026-001',
        conveyorLine: 'Line D (Quality Audit Gate)',
        color: 0xe11d48, // Crimson Rose
        geo: new THREE.BoxGeometry(1.4, 0.6, 1.0),
      },
    ];

    packageTemplates.forEach((tmpl, i) => {
      const pGroup = new THREE.Group();

      const boxMat = new THREE.MeshStandardMaterial({
        color: tmpl.color,
        roughness: 0.4,
        metalness: 0.1,
      });
      const boxMesh = new THREE.Mesh(tmpl.geo, boxMat);
      boxMesh.position.y = 1.4 + tmpl.geo.parameters.height / 2;
      boxMesh.castShadow = true;
      pGroup.add(boxMesh);

      // Wooden Pallet under box
      const palletMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
      const palletGeo = new THREE.BoxGeometry(
        tmpl.geo.parameters.width + 0.18,
        0.12,
        tmpl.geo.parameters.depth + 0.18
      );
      const pallet = new THREE.Mesh(palletGeo, palletMat);
      pallet.position.y = 1.4 + 0.06;
      pallet.castShadow = true;
      pGroup.add(pallet);

      // White optical barcode tag
      const tagMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const tagGeo = new THREE.PlaneGeometry(0.55, 0.28);
      const tag = new THREE.Mesh(tagGeo, tagMat);
      tag.position.set(0, boxMesh.position.y, tmpl.geo.parameters.depth / 2 + 0.01);
      pGroup.add(tag);

      const initialX = -12 + i * 6.5;
      pGroup.position.x = initialX;

      scene.add(pGroup);
      packages.push({
        group: pGroup,
        speed: 2.2,
        startX: -14,
        endX: 13,
        info: tmpl,
      });
    });

    // 9. Interactive Drag Camera Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotY = 0.7;
    let rotX = 0.45;
    let camDistance = 30;

    const updateCamera = () => {
      if (!cameraRef.current) return;
      const x = camDistance * Math.sin(rotY) * Math.cos(rotX);
      const y = camDistance * Math.sin(rotX);
      const z = camDistance * Math.cos(rotY) * Math.cos(rotX);
      cameraRef.current.position.set(x, Math.max(3, y), z);
      cameraRef.current.lookAt(0, 1.8, 0);
    };

    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        rotY -= dx * 0.006;
        rotX = Math.max(0.1, Math.min(Math.PI / 2.3, rotX + dy * 0.005));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        updateCamera();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camDistance = Math.max(16, Math.min(48, camDistance + e.deltaY * 0.03));
      updateCamera();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 10. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      rollers.forEach((r) => {
        r.rotation.y += delta * 6;
      });

      packages.forEach((pkg) => {
        pkg.group.position.x += delta * pkg.speed;

        if (Math.abs(pkg.group.position.x) < 0.8) {
          laserPlane.visible = Math.sin(clock.getElapsedTime() * 20) > -0.2;
          curtain.visible = true;
          setActiveItem(pkg.info);
        }

        if (pkg.group.position.x > pkg.endX) {
          pkg.group.position.x = pkg.startX;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      if (rendererRef.current?.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-zinc-200 bg-white shadow-xl group">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} style={{ height, width: '100%' }} className="cursor-grab active:cursor-grabbing" />

      {/* Top Left Status Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/95 border border-zinc-200/90 backdrop-blur-md shadow-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-900 tracking-wide">
            Automated Conveyor Sortation
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            1.4 m/s Active
          </span>
        </div>
      </div>

      {/* Floating HUD Card: Active Scanned Cargo Details */}
      <div className="absolute bottom-4 left-4 max-w-sm w-full bg-white/95 border border-zinc-200 rounded-2xl p-4 shadow-xl backdrop-blur-xl animate-in fade-in duration-150">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-1.5 text-zinc-900 font-bold font-mono">
            <Scan className="w-3.5 h-3.5 text-emerald-600" />
            <span>OPTICAL SENSOR GATE</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            {activeItem.status}
          </span>
        </div>

        <div className="mt-2.5 space-y-1">
          <h4 className="text-sm font-bold text-zinc-900 line-clamp-1">{activeItem.title}</h4>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-0.5">
            <span>SKU: {activeItem.sku}</span>
            <span className="text-emerald-600 font-bold">{activeItem.weight}</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono pt-1">
            Tracking: {activeItem.conveyorLine}
          </div>
        </div>
      </div>

      {/* Top Right Controls & Hint */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs text-zinc-500 shadow-sm backdrop-blur-md">
        <span>Click & drag to orbit 3D view</span>
      </div>

      {/* Bottom Right Legend */}
      <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-3 bg-white/90 px-3.5 py-1.5 rounded-xl border border-zinc-200 text-[11px] text-zinc-600 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
          <span>Vendor Intake</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 inline-block" />
          <span>Staging</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block" />
          <span>Outbound</span>
        </div>
      </div>
    </div>
  );
};
