import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useInventory } from '../../context/InventoryContext';
import { Product } from '../../types/inventory';
import { Eye, Layers, RotateCw, ZoomIn, ZoomOut, Box, Sparkles } from 'lucide-react';

interface Warehouse3DCanvasProps {
  height?: string;
  interactive?: boolean;
  selectedWarehouseId?: string;
  onSelectProduct?: (product: Product) => void;
}

export const Warehouse3DCanvas: React.FC<Warehouse3DCanvasProps> = ({
  height = '420px',
  interactive = true,
  selectedWarehouseId,
  onSelectProduct,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { products, warehouses, getLocationName } = useInventory();

  const [activeRackInfo, setActiveRackInfo] = useState<{
    rackName: string;
    productName: string;
    sku: string;
    qty: number;
    capacity: number;
    color: string;
    utilization: number;
  } | null>(null);

  const [cameraMode, setCameraMode] = useState<'iso' | 'top' | 'front'>('iso');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const forkliftRef = useRef<THREE.Group | null>(null);
  const interactiveBinsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const heightPx = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 1000);
    camera.position.set(22, 18, 24);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights - Bright Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaf0, 2.0);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const accentLight = new THREE.DirectionalLight(0xe2e8f0, 1.2);
    accentLight.position.set(-15, 20, -10);
    scene.add(accentLight);

    // 5. Floor with Grid & Line Markings
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(60, 40, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Yellow safety aisle markings
    const lineMat = new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 2 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-18, 0.02, 0),
      new THREE.Vector3(18, 0.02, 0),
    ]);
    const aisleLine1 = new THREE.Line(lineGeo, lineMat);
    aisleLine1.position.z = 2.5;
    scene.add(aisleLine1);

    const aisleLine2 = new THREE.Line(lineGeo, lineMat);
    aisleLine2.position.z = -2.5;
    scene.add(aisleLine2);

    // 6. Build Modular Warehouse Racks
    interactiveBinsRef.current = [];

    const rackRows = [
      { z: -8, label: 'Rack Aisle North (Rack A & B)' },
      { z: 8, label: 'Rack Aisle South (High-Bay)' },
    ];

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.8,
    });

    const orangeBeams = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.5,
      metalness: 0.5,
    });

    rackRows.forEach((row, rowIndex) => {
      // 4 bays per row
      for (let bay = -2; bay <= 2; bay++) {
        if (bay === 0) continue; // Walkway gap
        const xPos = bay * 6;

        // Uprights
        const uprightGeo = new THREE.BoxGeometry(0.2, 8, 0.2);
        [-1.8, 1.8].forEach((xOff) => {
          [-1.2, 1.2].forEach((zOff) => {
            const upright = new THREE.Mesh(uprightGeo, steelMat);
            upright.position.set(xPos + xOff, 4, row.z + zOff);
            upright.castShadow = true;
            scene.add(upright);
          });
        });

        // 3 Shelf Levels
        for (let level = 1; level <= 3; level++) {
          const yPos = level * 2.4;

          // Cross Beams
          const beamGeo = new THREE.BoxGeometry(3.6, 0.15, 2.4);
          const beam = new THREE.Mesh(beamGeo, orangeBeams);
          beam.position.set(xPos, yPos, row.z);
          beam.receiveShadow = true;
          scene.add(beam);

          // Place Pallet & Cargo Bin
          // Assign a product to this slot based on rowIndex and bay
          const prodIndex = (Math.abs(bay) + rowIndex * 3 + level) % products.length;
          const assignedProd = products[prodIndex];
          const stock = assignedProd ? assignedProd.totalStock : 0;
          const minStock = assignedProd ? assignedProd.reorderingRule.minQuantity : 10;

          // Color based on stock health
          let boxColor = 0x10b981; // Green (Healthy)
          if (stock === 0) boxColor = 0xef4444; // Red (Empty)
          else if (stock <= minStock) boxColor = 0xf59e0b; // Amber (Low)
          else if (assignedProd?.category === 'Metals & Steel') boxColor = 0x38bdf8; // Blue for steel
          else if (assignedProd?.category === 'Finished Goods') boxColor = 0xa855f7; // Purple

          const boxGeo = new THREE.BoxGeometry(1.4, 1.1, 1.6);
          const boxMat = new THREE.MeshStandardMaterial({
            color: boxColor,
            roughness: 0.3,
            metalness: 0.1,
          });

          // Add 2 cargo boxes per shelf level
          [-0.8, 0.8].forEach((subOffset, subIdx) => {
            const cargo = new THREE.Mesh(boxGeo, boxMat.clone());
            cargo.position.set(xPos + subOffset, yPos + 0.65, row.z);
            cargo.castShadow = true;
            cargo.receiveShadow = true;

            // Attach metadata for raycasting interaction
            cargo.userData = {
              rackName: `${rowIndex === 0 ? 'Rack A' : 'Bay 2'}-B${Math.abs(bay)}-L${level}-${subIdx === 0 ? 'L' : 'R'}`,
              productName: assignedProd ? assignedProd.name : 'Bulk Items',
              sku: assignedProd ? assignedProd.sku : 'SKU-GEN',
              qty: assignedProd ? Math.round(assignedProd.totalStock / 2) : 20,
              capacity: 100,
              color: `#${boxColor.toString(16)}`,
              product: assignedProd,
            };

            scene.add(cargo);
            interactiveBinsRef.current.push(cargo);

            // Small pallet under cargo
            const palletGeo = new THREE.BoxGeometry(1.5, 0.12, 1.7);
            const palletMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
            const pallet = new THREE.Mesh(palletGeo, palletMat);
            pallet.position.set(xPos + subOffset, yPos + 0.08, row.z);
            scene.add(pallet);
          });
        }
      }
    });

    // 7. Animated Autonomous Forklift (AGV)
    const forkliftGroup = new THREE.Group();

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.8, 1.4);
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const chassis = new THREE.Mesh(chassisGeo, yellowMat);
    chassis.position.y = 0.6;
    chassis.castShadow = true;
    forkliftGroup.add(chassis);

    // Cab / Mast
    const mastGeo = new THREE.BoxGeometry(0.3, 2.2, 1.2);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, darkMat);
    mast.position.set(1.1, 1.4, 0);
    forkliftGroup.add(mast);

    // Forks
    const forkGeo = new THREE.BoxGeometry(1.2, 0.08, 0.15);
    const fork1 = new THREE.Mesh(forkGeo, steelMat);
    fork1.position.set(1.7, 0.3, -0.3);
    const fork2 = new THREE.Mesh(forkGeo, steelMat);
    fork2.position.set(1.7, 0.3, 0.3);
    forkliftGroup.add(fork1);
    forkliftGroup.add(fork2);

    // Forklift Cargo Pallet (Steel Rods / Materials)
    const cargoForksGeo = new THREE.BoxGeometry(0.9, 0.8, 1.0);
    const steelCargoMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7 });
    const loadedCargo = new THREE.Mesh(cargoForksGeo, steelCargoMat);
    loadedCargo.position.set(1.7, 0.8, 0);
    forkliftGroup.add(loadedCargo);

    // Safety beacon light
    const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(-0.6, 1.4, 0);
    forkliftGroup.add(beacon);

    forkliftGroup.position.set(-14, 0, 0);
    scene.add(forkliftGroup);
    forkliftRef.current = forkliftGroup;

    // 8. Mouse Raycasting for Interactive Cargo Inspection & Drag Orbit
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationAngle = 0.8;
    let verticalAngle = 0.55;
    let cameraDistance = 34;

    const updateCameraPos = () => {
      if (!cameraRef.current) return;
      const x = cameraDistance * Math.sin(rotationAngle) * Math.cos(verticalAngle);
      const y = cameraDistance * Math.sin(verticalAngle);
      const z = cameraDistance * Math.cos(rotationAngle) * Math.cos(verticalAngle);
      cameraRef.current.position.set(x, Math.max(3, y), z);
      cameraRef.current.lookAt(0, 2, 0);
    };

    updateCameraPos();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        rotationAngle -= deltaX * 0.007;
        verticalAngle = Math.max(0.15, Math.min(Math.PI / 2.2, verticalAngle + deltaY * 0.005));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        updateCameraPos();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      // Check if it was a quick click to inspect a cargo slot
      const rect = container.getBoundingClientRect();
      const clickDist = Math.hypot(e.clientX - prevMouseX, e.clientY - prevMouseY);
      if (clickDist < 5) {
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveBinsRef.current);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit.userData && hit.userData.rackName) {
            const data = hit.userData;
            const util = Math.round((data.qty / data.capacity) * 100);
            setActiveRackInfo({
              rackName: data.rackName,
              productName: data.productName,
              sku: data.sku,
              qty: data.qty,
              capacity: data.capacity,
              color: data.color,
              utilization: util,
            });

            if (data.product && onSelectProduct) {
              onSelectProduct(data.product);
            }
          }
        }
      }
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance = Math.max(16, Math.min(55, cameraDistance + e.deltaY * 0.03));
      updateCameraPos();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 9. Animation Loop
    let animationFrameId: number;
    let forkliftProgress = 0;
    let forkliftDirection = 1;

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Autonomous forklift pathing along aisle
      if (forkliftRef.current) {
        forkliftProgress += delta * 0.25 * forkliftDirection;
        if (forkliftProgress > 1) {
          forkliftProgress = 1;
          forkliftDirection = -1;
          forkliftRef.current.rotation.y = Math.PI;
        } else if (forkliftProgress < 0) {
          forkliftProgress = 0;
          forkliftDirection = 1;
          forkliftRef.current.rotation.y = 0;
        }

        // Move along X axis from -14 to +14
        const posX = -14 + forkliftProgress * 28;
        forkliftRef.current.position.x = posX;
      }

      // Beacon flicker
      beacon.visible = Math.sin(clock.getElapsedTime() * 12) > 0;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 420;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [products, warehouses]);

  // Quick Camera Presets
  const setPresetCamera = (mode: 'iso' | 'top' | 'front') => {
    setCameraMode(mode);
    if (!cameraRef.current) return;

    if (mode === 'iso') {
      cameraRef.current.position.set(22, 18, 24);
      cameraRef.current.lookAt(0, 2, 0);
    } else if (mode === 'top') {
      cameraRef.current.position.set(0, 36, 0.1);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (mode === 'front') {
      cameraRef.current.position.set(0, 4, 30);
      cameraRef.current.lookAt(0, 4, 0);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.85 : 1.15;
    cameraRef.current.position.multiplyScalar(factor);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-zinc-200 bg-white shadow-xl group">
      {/* Canvas Mount */}
      <div ref={containerRef} style={{ height, width: '100%' }} className="cursor-grab active:cursor-grabbing" />

      {/* Top Overlay Badge & Title */}
      <div className="absolute top-4 left-4 flex items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/95 border border-zinc-200 backdrop-blur-md shadow-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-900">3D Warehouse Digital Twin</span>
          <span className="text-[10px] font-mono font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
            LIVE AGV
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600 bg-white/90 px-3 py-1 rounded-xl border border-zinc-200 shadow-sm">
          <span>Click any bay to inspect</span>
        </div>
      </div>

      {/* Camera View Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 p-1.5 rounded-2xl border border-zinc-200 shadow-md backdrop-blur-md">
        <button
          onClick={() => setPresetCamera('iso')}
          title="Isometric View"
          className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
            cameraMode === 'iso' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Isometric
        </button>
        <button
          onClick={() => setPresetCamera('top')}
          title="Top-down 2D Plan"
          className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
            cameraMode === 'top' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Top Plan
        </button>
        <button
          onClick={() => setPresetCamera('front')}
          title="Aisle View"
          className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
            cameraMode === 'front' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Aisle
        </button>

        <div className="w-px h-4 bg-zinc-200 mx-1" />

        <button
          onClick={() => handleZoom('in')}
          title="Zoom In"
          aria-label="Zoom in 3D camera"
          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          title="Zoom Out"
          aria-label="Zoom out 3D camera"
          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Bay Inspection Popup */}
      {activeRackInfo && (
        <div className="absolute bottom-4 left-4 max-w-sm w-full bg-white/95 border border-zinc-200 rounded-2xl p-4 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-md shadow-sm"
                style={{ backgroundColor: activeRackInfo.color }}
              />
              <span className="font-mono text-xs font-bold text-zinc-900">
                {activeRackInfo.rackName}
              </span>
            </div>
            <button
              onClick={() => setActiveRackInfo(null)}
              className="text-zinc-400 hover:text-zinc-700 text-xs px-1.5 py-0.5 rounded hover:bg-zinc-100"
            >
              ✕
            </button>
          </div>

          <h4 className="text-sm font-bold text-zinc-900 line-clamp-1">
            {activeRackInfo.productName}
          </h4>
          <div className="flex items-center justify-between text-xs text-zinc-500 mt-1 mb-2 font-mono">
            <span>SKU: {activeRackInfo.sku}</span>
            <span className="text-emerald-700 font-bold">{activeRackInfo.qty} stored</span>
          </div>

          {/* Capacity Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>Bay Capacity</span>
              <span className="text-zinc-900 font-semibold">{activeRackInfo.utilization}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeRackInfo.utilization > 85
                    ? 'bg-amber-500'
                    : activeRackInfo.utilization < 20
                    ? 'bg-rose-500'
                    : 'bg-zinc-900'
                }`}
                style={{ width: `${Math.min(100, activeRackInfo.utilization)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-3 bg-white/95 px-3.5 py-1.5 rounded-xl border border-zinc-200 text-[11px] text-zinc-700 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          <span>Optimal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
          <span>Low Threshold</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
          <span>Stockout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-zinc-800 inline-block" />
          <span>Metals</span>
        </div>
      </div>
    </div>
  );
};
