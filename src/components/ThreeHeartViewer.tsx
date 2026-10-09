import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Heart, RotateCcw, ZoomIn, ZoomOut, Eye, Layers, 
  Info, Sparkles, AlertCircle, Maximize2, ShieldAlert, CheckCircle2, Stethoscope 
} from 'lucide-react';
import { PredictionResponse, LimeFeatureItem } from '../types/cardio';

interface ThreeHeartViewerProps {
  predictionData?: PredictionResponse | null;
  greenThreshold?: number;
  yellowThreshold?: number;
  selectedVessel?: 'LAD' | 'LCX' | 'RCA' | null;
  onSelectVessel?: (vessel: 'LAD' | 'LCX' | 'RCA' | null) => void;
}

export const ThreeHeartViewer: React.FC<ThreeHeartViewerProps> = ({
  predictionData,
  greenThreshold = 0.40,
  yellowThreshold = 0.65,
  selectedVessel: controlledSelectedVessel,
  onSelectVessel,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [internalSelectedVessel, setInternalSelectedVessel] = useState<'LAD' | 'LCX' | 'RCA' | null>('LAD');
  const [selectedStructureName, setSelectedStructureName] = useState<string>('LAD Coronary Artery');
  const [isBeating, setIsBeating] = useState<boolean>(true);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showRefModal, setShowRefModal] = useState<boolean>(false);
  const [refTab, setRefTab] = useState<'xray' | 'tree' | 'exploded'>('xray');

  const activeVessel = controlledSelectedVessel !== undefined ? controlledSelectedVessel : internalSelectedVessel;

  const handleSelectVessel = (v: 'LAD' | 'LCX' | 'RCA' | null, structName?: string) => {
    if (onSelectVessel) {
      onSelectVessel(v);
    } else {
      setInternalSelectedVessel(v);
    }
    if (structName) {
      setSelectedStructureName(structName);
    } else if (v) {
      setSelectedStructureName(`${v} Coronary Artery`);
    }
  };

  // Helper to get color based on predicted probability
  const getProbabilityColor = (prob?: number) => {
    if (prob === undefined || prob === null) return 0x64748b; // Grey
    if (prob < greenThreshold) return 0x10b981; // Green (Lower predicted probability)
    if (prob <= yellowThreshold) return 0xf59e0b; // Yellow (Intermediate)
    return 0xef4444; // Red (Higher predicted probability)
  };

  const getProbabilityHex = (prob?: number) => {
    if (prob === undefined || prob === null) return '#64748b';
    if (prob < greenThreshold) return '#10b981';
    if (prob <= yellowThreshold) return '#f59e0b';
    return '#ef4444';
  };

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const arteriesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const explodedGroupRef = useRef<THREE.Group | null>(null);
  const valvesGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060913);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 9.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 3;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(6, 10, 8);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.0);
    dirLight2.position.set(-8, -4, -6);
    scene.add(dirLight2);

    const heartRootGroup = new THREE.Group();
    scene.add(heartRootGroup);

    const explodedGroup = new THREE.Group();
    heartRootGroup.add(explodedGroup);
    explodedGroupRef.current = explodedGroup;

    // 3. Anatomical Materials
    const myocardiumMat = new THREE.MeshStandardMaterial({
      color: 0x9f1239, // Deep anatomical cardiac muscle red
      roughness: 0.45,
      metalness: 0.1,
    });

    const atriumMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      roughness: 0.5,
      metalness: 0.05,
    });

    const aortaMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Bright arterial oxygenated red
      roughness: 0.35,
      metalness: 0.15,
    });

    const pulmonaryMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Deoxygenated venous blue
      roughness: 0.4,
      metalness: 0.1,
    });

    const venaCavaMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Deep venous blue
      roughness: 0.4,
      metalness: 0.1,
    });

    const valveMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Fibrous pearl white
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    // 4. Constructing Anatomical Heart Chambers & Structures

    // A. Left Ventricle (apex, thicker myocardial wall)
    const lvGeo = new THREE.SphereGeometry(1.4, 32, 32);
    lvGeo.scale(1.0, 1.45, 0.95);
    const lvMesh = new THREE.Mesh(lvGeo, myocardiumMat.clone());
    lvMesh.position.set(0.4, -0.6, 0);
    lvMesh.rotation.z = -0.15;
    lvMesh.userData = { name: 'Left Ventricle', type: 'chamber' };
    explodedGroup.add(lvMesh);

    // B. Right Ventricle (anterior, wraps anterior septum)
    const rvGeo = new THREE.SphereGeometry(1.25, 32, 32);
    rvGeo.scale(0.9, 1.35, 0.85);
    const rvMesh = new THREE.Mesh(rvGeo, myocardiumMat.clone());
    rvMesh.position.set(-0.8, -0.5, 0.35);
    rvMesh.rotation.z = 0.12;
    rvMesh.userData = { name: 'Right Ventricle', type: 'chamber' };
    explodedGroup.add(rvMesh);

    // C. Left Atrium (posterior base)
    const laGeo = new THREE.SphereGeometry(0.85, 24, 24);
    laGeo.scale(1.0, 0.9, 0.9);
    const laMesh = new THREE.Mesh(laGeo, atriumMat);
    laMesh.position.set(0.65, 1.1, -0.4);
    laMesh.userData = { name: 'Left Atrium', type: 'chamber' };
    explodedGroup.add(laMesh);

    // D. Right Atrium (receives SVC and IVC)
    const raGeo = new THREE.SphereGeometry(0.95, 24, 24);
    raGeo.scale(0.95, 1.1, 0.95);
    const raMesh = new THREE.Mesh(raGeo, atriumMat);
    raMesh.position.set(-1.1, 0.85, 0.1);
    raMesh.userData = { name: 'Right Atrium', type: 'chamber' };
    explodedGroup.add(raMesh);

    // E. Aorta & Aortic Arch (with 3 aortic branches)
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.5, 0.1),
      new THREE.Vector3(0.0, 1.6, 0.2),
      new THREE.Vector3(-0.2, 2.2, 0.1),
      new THREE.Vector3(0.3, 2.4, -0.2),
      new THREE.Vector3(0.8, 1.7, -0.5),
      new THREE.Vector3(0.9, 0.4, -0.8), // Descending aorta
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 40, 0.38, 20, false);
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
    aortaMesh.userData = { name: 'Aorta & Aortic Arch', type: 'vessel' };
    explodedGroup.add(aortaMesh);

    // Aortic Arch Branches (Brachiocephalic, Left Common Carotid, Left Subclavian)
    const branch1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 2.2, 0.1),
      new THREE.Vector3(-0.35, 2.9, 0.15)
    ]);
    const branch1Mesh = new THREE.Mesh(new THREE.TubeGeometry(branch1Curve, 10, 0.12, 12, false), aortaMat);
    explodedGroup.add(branch1Mesh);

    const branch2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 2.35, 0.0),
      new THREE.Vector3(0.05, 3.0, 0.0)
    ]);
    const branch2Mesh = new THREE.Mesh(new THREE.TubeGeometry(branch2Curve, 10, 0.11, 12, false), aortaMat);
    explodedGroup.add(branch2Mesh);

    const branch3Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.35, 2.35, -0.15),
      new THREE.Vector3(0.45, 2.9, -0.2)
    ]);
    const branch3Mesh = new THREE.Mesh(new THREE.TubeGeometry(branch3Curve, 10, 0.11, 12, false), aortaMat);
    explodedGroup.add(branch3Mesh);

    // F. Pulmonary Artery & Bifurcation
    const paCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 0.2, 0.7),
      new THREE.Vector3(-0.2, 1.2, 0.5),
      new THREE.Vector3(0.0, 1.5, 0.1),
    ]);
    const paGeo = new THREE.TubeGeometry(paCurve, 30, 0.36, 20, false);
    const paMesh = new THREE.Mesh(paGeo, pulmonaryMat);
    paMesh.userData = { name: 'Pulmonary Artery', type: 'vessel' };
    explodedGroup.add(paMesh);

    // Pulmonary branches (Left & Right)
    const paLeftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 1.5, 0.1),
      new THREE.Vector3(1.2, 1.4, -0.3)
    ]);
    const paLeftMesh = new THREE.Mesh(new THREE.TubeGeometry(paLeftCurve, 15, 0.22, 16, false), pulmonaryMat);
    explodedGroup.add(paLeftMesh);

    const paRightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 1.5, 0.1),
      new THREE.Vector3(-1.4, 1.4, -0.2)
    ]);
    const paRightMesh = new THREE.Mesh(new THREE.TubeGeometry(paRightCurve, 15, 0.22, 16, false), pulmonaryMat);
    explodedGroup.add(paRightMesh);

    // G. Superior & Inferior Vena Cava
    const svcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.25, 0.8, -0.1),
      new THREE.Vector3(-1.3, 2.3, -0.1)
    ]);
    const svcMesh = new THREE.Mesh(new THREE.TubeGeometry(svcCurve, 20, 0.28, 16, false), venaCavaMat);
    svcMesh.userData = { name: 'Superior Vena Cava', type: 'vessel' };
    explodedGroup.add(svcMesh);

    const ivcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.1, -0.3, -0.2),
      new THREE.Vector3(-1.1, -1.5, -0.2)
    ]);
    const ivcMesh = new THREE.Mesh(new THREE.TubeGeometry(ivcCurve, 15, 0.25, 16, false), venaCavaMat);
    explodedGroup.add(ivcMesh);

    // H. Pulmonary Veins (Left and Right pairs entering Left Atrium)
    const pvPairs = [
      [new THREE.Vector3(0.9, 1.4, -0.4), new THREE.Vector3(1.6, 1.6, -0.5)],
      [new THREE.Vector3(0.9, 0.9, -0.5), new THREE.Vector3(1.6, 0.8, -0.7)],
      [new THREE.Vector3(0.1, 1.3, -0.8), new THREE.Vector3(-0.7, 1.4, -0.9)],
      [new THREE.Vector3(0.1, 0.8, -0.8), new THREE.Vector3(-0.7, 0.7, -1.0)]
    ];
    pvPairs.forEach(([p1, p2]) => {
      const pvCurve = new THREE.CatmullRomCurve3([p1, p2]);
      const pvMesh = new THREE.Mesh(new THREE.TubeGeometry(pvCurve, 10, 0.15, 12, false), pulmonaryMat);
      pvMesh.userData = { name: 'Pulmonary Veins', type: 'vessel' };
      explodedGroup.add(pvMesh);
    });

    // I. Cardiac Valves (Tricuspid, Pulmonary, Mitral, Aortic)
    const valvesGroup = new THREE.Group();
    explodedGroup.add(valvesGroup);
    valvesGroupRef.current = valvesGroup;

    // Aortic Valve (base of aorta)
    const avGeo = new THREE.TorusGeometry(0.35, 0.08, 16, 24);
    const avMesh = new THREE.Mesh(avGeo, valveMat);
    avMesh.position.set(0.08, 0.55, 0.15);
    avMesh.rotation.x = Math.PI / 3;
    avMesh.userData = { name: 'Aortic Valve', type: 'valve' };
    valvesGroup.add(avMesh);

    // Mitral Valve (bicuspid, between LA and LV)
    const mvGeo = new THREE.TorusGeometry(0.42, 0.08, 16, 24);
    const mvMesh = new THREE.Mesh(mvGeo, valveMat);
    mvMesh.position.set(0.5, 0.3, -0.2);
    mvMesh.rotation.x = Math.PI / 4;
    mvMesh.userData = { name: 'Mitral Valve', type: 'valve' };
    valvesGroup.add(mvMesh);

    // Tricuspid Valve (between RA and RV)
    const tvGeo = new THREE.TorusGeometry(0.44, 0.08, 16, 24);
    const tvMesh = new THREE.Mesh(tvGeo, valveMat);
    tvMesh.position.set(-0.75, 0.15, 0.15);
    tvMesh.rotation.x = Math.PI / 3.5;
    tvMesh.userData = { name: 'Tricuspid Valve', type: 'valve' };
    valvesGroup.add(tvMesh);

    // Pulmonary Valve (base of pulmonary trunk)
    const pvGeo = new THREE.TorusGeometry(0.33, 0.07, 16, 24);
    const pvMesh = new THREE.Mesh(pvGeo, valveMat);
    pvMesh.position.set(-0.35, 0.35, 0.65);
    pvMesh.rotation.x = Math.PI / 2.8;
    pvMesh.userData = { name: 'Pulmonary Valve', type: 'valve' };
    valvesGroup.add(pvMesh);

    // 5. CORONARY ARTERY NETWORK (LAD, LCX, RCA)
    // Dynamic materials for coronary arteries based on model predictions
    const cadProbs = predictionData?.predictions;

    // LAD (Left Anterior Descending)
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.12, 0.55, 0.3), // Branching from Left Main
      new THREE.Vector3(0.15, 0.2, 0.82),
      new THREE.Vector3(0.05, -0.3, 0.98),
      new THREE.Vector3(-0.05, -0.9, 0.95),
      new THREE.Vector3(-0.08, -1.5, 0.75),
      new THREE.Vector3(-0.05, -2.1, 0.35), // Runs towards apex
    ]);
    const ladGeo = new THREE.TubeGeometry(ladCurve, 45, 0.085, 16, false);
    const ladProb = cadProbs?.LAD?.probability;
    const ladMat = new THREE.MeshStandardMaterial({
      color: getProbabilityColor(ladProb),
      roughness: 0.3,
      metalness: 0.2,
      emissive: getProbabilityColor(ladProb),
      emissiveIntensity: activeVessel === 'LAD' ? 0.6 : 0.15,
    });
    const ladMesh = new THREE.Mesh(ladGeo, ladMat);
    ladMesh.userData = { name: 'LAD Coronary Artery', key: 'LAD', type: 'artery' };
    explodedGroup.add(ladMesh);
    arteriesRef.current['LAD'] = ladMesh;

    // Diagonal branch off LAD
    const diagCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, -0.3, 0.98),
      new THREE.Vector3(0.45, -0.7, 0.85),
      new THREE.Vector3(0.85, -1.1, 0.65),
    ]);
    const diagMesh = new THREE.Mesh(new THREE.TubeGeometry(diagCurve, 15, 0.055, 12, false), ladMat);
    explodedGroup.add(diagMesh);

    // LCX (Left Circumflex Artery)
    const lcxCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.12, 0.55, 0.3),
      new THREE.Vector3(0.5, 0.45, 0.4),
      new THREE.Vector3(0.95, 0.2, 0.1),
      new THREE.Vector3(1.2, -0.2, -0.3),
      new THREE.Vector3(1.1, -0.8, -0.6),
      new THREE.Vector3(0.8, -1.4, -0.7), // Courses around AV groove to posterior LV
    ]);
    const lcxGeo = new THREE.TubeGeometry(lcxCurve, 45, 0.08, 16, false);
    const lcxProb = cadProbs?.LCX?.probability;
    const lcxMat = new THREE.MeshStandardMaterial({
      color: getProbabilityColor(lcxProb),
      roughness: 0.3,
      metalness: 0.2,
      emissive: getProbabilityColor(lcxProb),
      emissiveIntensity: activeVessel === 'LCX' ? 0.6 : 0.15,
    });
    const lcxMesh = new THREE.Mesh(lcxGeo, lcxMat);
    lcxMesh.userData = { name: 'LCX Coronary Artery', key: 'LCX', type: 'artery' };
    explodedGroup.add(lcxMesh);
    arteriesRef.current['LCX'] = lcxMesh;

    // Obtuse Marginal (OM) branch off LCX
    const omCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.95, 0.2, 0.1),
      new THREE.Vector3(1.1, -0.4, 0.2),
      new THREE.Vector3(1.0, -1.0, 0.2),
    ]);
    const omMesh = new THREE.Mesh(new THREE.TubeGeometry(omCurve, 15, 0.055, 12, false), lcxMat);
    explodedGroup.add(omMesh);

    // RCA (Right Coronary Artery)
    const rcaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 0.55, 0.3),
      new THREE.Vector3(-0.6, 0.45, 0.5),
      new THREE.Vector3(-1.15, 0.1, 0.55),
      new THREE.Vector3(-1.3, -0.4, 0.45),
      new THREE.Vector3(-1.25, -1.0, 0.2),
      new THREE.Vector3(-1.0, -1.5, -0.1),
      new THREE.Vector3(-0.5, -1.8, -0.4), // Posterior descending artery branch
    ]);
    const rcaGeo = new THREE.TubeGeometry(rcaCurve, 45, 0.085, 16, false);
    const rcaProb = cadProbs?.RCA?.probability;
    const rcaMat = new THREE.MeshStandardMaterial({
      color: getProbabilityColor(rcaProb),
      roughness: 0.3,
      metalness: 0.2,
      emissive: getProbabilityColor(rcaProb),
      emissiveIntensity: activeVessel === 'RCA' ? 0.6 : 0.15,
    });
    const rcaMesh = new THREE.Mesh(rcaGeo, rcaMat);
    rcaMesh.userData = { name: 'RCA Coronary Artery', key: 'RCA', type: 'artery' };
    explodedGroup.add(rcaMesh);
    arteriesRef.current['RCA'] = rcaMesh;

    // Raycaster for user clicking/selecting coronary arteries
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(explodedGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.key) {
          handleSelectVessel(hit.userData.key, hit.userData.name);
        } else if (hit.userData?.name) {
          setSelectedStructureName(hit.userData.name);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      controls.update();

      const time = clock.getElapsedTime();

      // Cardiac heartbeat cycle simulation (systole & diastole contraction)
      if (isBeating) {
        const pulse = Math.sin(time * 3.8); // ~72 bpm
        const ventricularScale = 1.0 + (pulse > 0.4 ? Math.pow(pulse, 3) * 0.035 : 0.0);
        heartRootGroup.scale.set(ventricularScale, ventricularScale, ventricularScale);
      } else {
        heartRootGroup.scale.set(1, 1, 1);
      }

      // Selected Artery Pulse Glow
      if (activeVessel && arteriesRef.current[activeVessel]) {
        const mat = arteriesRef.current[activeVessel].material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.5 + Math.sin(time * 5) * 0.3;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      container.replaceChildren();
    };
  }, [greenThreshold, yellowThreshold, predictionData, isBeating]);

  // Update selected vessel highlights when prop changes
  useEffect(() => {
    ['LAD', 'LCX', 'RCA'].forEach((key) => {
      const mesh = arteriesRef.current[key];
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (key === activeVessel) {
          mat.emissiveIntensity = 0.6;
        } else {
          mat.emissiveIntensity = 0.15;
        }
      }
    });
  }, [activeVessel]);

  // Exploded / Transparency view toggle
  useEffect(() => {
    if (!explodedGroupRef.current) return;
    explodedGroupRef.current.children.forEach((child: any) => {
      if (child.userData?.type === 'chamber') {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (isExploded) {
          mat.transparent = true;
          mat.opacity = 0.35;
          mat.roughness = 0.8;
        } else {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.roughness = 0.45;
        }
      }
    });
  }, [isExploded]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 1.5, 9.5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const getActiveVesselDetails = () => {
    if (!activeVessel) return null;
    const taskPred = predictionData?.predictions?.[activeVessel];
    const limeExp = predictionData?.lime_explanations?.[activeVessel];
    const reported = predictionData?.reported_findings;

    let reportedBlockage = 'Unavailable / Not clinically measured';
    if (activeVessel === 'LAD' && reported?.lad_status && !reported.lad_status.includes('Unavailable')) {
      reportedBlockage = reported.lad_status;
    } else if (activeVessel === 'LCX' && reported?.lcx_status && !reported.lcx_status.includes('Unavailable')) {
      reportedBlockage = reported.lcx_status;
    } else if (activeVessel === 'RCA' && reported?.rca_status && !reported.rca_status.includes('Unavailable')) {
      reportedBlockage = reported.rca_status;
    }

    return {
      vesselKey: activeVessel,
      taskPred,
      limeExp,
      reportedBlockage,
    };
  };

  const vesselDetails = getActiveVesselDetails();

  return (
    <div className="relative w-full rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      
      {/* 3D Canvas Container */}
      <div className="relative w-full h-[520px] sm:h-[580px] bg-slate-950">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Control Bar overlay */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          
          {/* Quick Coronary Artery Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg pointer-events-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Coronary Arteries:</span>
            {(['LAD', 'LCX', 'RCA'] as const).map((v) => {
              const prob = predictionData?.predictions?.[v]?.probability;
              const colorHex = getProbabilityHex(prob);
              const isSelected = activeVessel === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleSelectVessel(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-600 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span>{v}</span>
                  {prob !== undefined && (
                    <span className="text-[10px] font-mono opacity-80">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Viewer Tools Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsBeating(!isBeating)}
              title={isBeating ? 'Pause cardiac pulse' : 'Resume cardiac pulse'}
              className={`p-2.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all cursor-pointer ${
                isBeating
                  ? 'bg-rose-950/70 border-rose-700 text-rose-300 shadow-sm shadow-rose-950'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isBeating ? 'animate-pulse text-rose-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsExploded(!isExploded)}
              title={isExploded ? 'Return to Solid Myocardium' : 'Exploded Cutaway View (Inspect Valves & Chambers)'}
              className={`p-2.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all cursor-pointer ${
                isExploded
                  ? 'bg-indigo-950/70 border-indigo-700 text-indigo-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={resetCamera}
              title="Reset 3D Camera View"
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white backdrop-blur-md transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Anatomical Reference Button */}
            <button
              type="button"
              onClick={() => setShowRefModal(true)}
              title="View Exploded Anatomical Reference Diagram"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reference Diagram</span>
            </button>
          </div>

        </div>

        {/* Anatomical Label Pin Overlays */}
        {showLabels && (
          <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] text-slate-400 space-y-1 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md max-w-xs">
            <span className="font-bold text-slate-200 block text-xs flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-rose-400" />
              Interactive Anatomical Structures
            </span>
            <p className="text-[10px] leading-tight text-slate-400">
              Left & Right Ventricles, Atria, Aorta & Branches, Pulmonary Artery, Pulmonary Veins, Vena Cava, Aortic & Mitral Valves.
            </p>
            <p className="text-[10px] text-slate-500 pt-0.5">
              Click any coronary artery or structure to inspect predicted risk vs confirmed clinical measurements.
            </p>
          </div>
        )}

        {/* EXACT REQUIRED COLOR LEGEND:
            * Green — lower predicted probability
            * Yellow — intermediate predicted probability
            * Red — higher predicted probability
            * Grey — prediction unavailable
            Make the probability thresholds configurable. Do not represent these colours as medically validated severity categories.
        */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 backdrop-blur-md shadow-xl text-xs space-y-2 pointer-events-auto max-w-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
              Predicted Risk Legend
            </span>
            <span className="text-[9px] text-slate-400">Configurable</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-950"></span>
                <span className="text-slate-200 font-medium">Green</span>
              </div>
              <span className="text-slate-400 text-[10px]">
                Lower predicted probability (&lt;{(greenThreshold * 100).toFixed(0)}%)
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500 shadow-sm shadow-amber-950"></span>
                <span className="text-slate-200 font-medium">Yellow</span>
              </div>
              <span className="text-slate-400 text-[10px]">
                Intermediate predicted probability ({(greenThreshold * 100).toFixed(0)}&ndash;{(yellowThreshold * 100).toFixed(0)}%)
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-rose-500 shadow-sm shadow-rose-950"></span>
                <span className="text-slate-200 font-medium">Red</span>
              </div>
              <span className="text-slate-400 text-[10px]">
                Higher predicted probability (&gt;{(yellowThreshold * 100).toFixed(0)}%)
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-500 shadow-sm"></span>
                <span className="text-slate-400 font-medium">Grey</span>
              </div>
              <span className="text-slate-400 text-[10px]">
                Prediction unavailable
              </span>
            </div>
          </div>

          <p className="text-[9px] text-slate-500 italic pt-1 border-t border-slate-800/80 leading-tight">
            Thresholds are customizable in Settings. Colors are educational representations, not medically validated severity categories.
          </p>
        </div>

      </div>

      {/* Selected Coronary Artery Inspection Drawer */}
      {vesselDetails && (
        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full shadow-md"
                style={{ backgroundColor: getProbabilityHex(vesselDetails.taskPred?.probability) }}
              />
              <h3 className="font-bold text-base text-white">
                {selectedStructureName} Inspection
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Model: {vesselDetails.taskPred?.model_family || 'Trained Model'}
              </span>
            </div>

            {vesselDetails.taskPred && (
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Predicted Risk Probability</span>
                  <span className="text-base font-extrabold font-mono text-white">
                    {(vesselDetails.taskPred.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                  vesselDetails.taskPred.probability >= yellowThreshold
                    ? 'bg-rose-950/70 text-rose-300 border-rose-700'
                    : vesselDetails.taskPred.probability >= greenThreshold
                    ? 'bg-amber-950/70 text-amber-300 border-amber-700'
                    : 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
                }`}>
                  {vesselDetails.taskPred.predicted_class}
                </span>
              </div>
            )}
          </div>

          {/* EXACT ANATOMICAL ACCURACY REQUIREMENT:
              Highlight the coronary artery associated with the prediction.
              Do not invent the precise location of a plaque, a lesion length, or an exact blockage percentage from a machine learning probability.
              Display an exact lesion location only when supported by valid anatomical findings from the supplied clinical data.
              Keep predicted risk separate from confirmed clinical findings.
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Confirmed Measured Findings (Field 14, 15, or 16) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                  Reported Clinical Angiography Findings
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Confirmed Data</span>
              </div>
              <p className="text-slate-200 text-sm font-medium">
                {vesselDetails.reportedBlockage}
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Separated from ML inference: Actual measured stenosis percentage and lesion location are derived strictly from entered clinical findings, never extrapolated from probability scores.
              </p>
            </div>

            {/* Vessel Specific LIME Explanations */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  LIME Top Factors for {vesselDetails.vesselKey} Stenosis
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Explainable AI</span>
              </div>

              {vesselDetails.limeExp && vesselDetails.limeExp.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {vesselDetails.limeExp.slice(0, 3).map((item: LimeFeatureItem, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-300 truncate max-w-[220px]" title={item.feature_condition}>
                        {item.feature_condition}
                      </span>
                      <span className={`font-mono text-[10px] font-semibold ${
                        item.direction === 'Risk-Increasing' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {item.weight > 0 ? `+${item.weight.toFixed(3)}` : item.weight.toFixed(3)} ({item.direction === 'Risk-Increasing' ? 'Risk' : 'Normalizing'})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic">
                  Run prediction to compute vessel-specific LIME feature attributions.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Imaging & Anatomical Reference Modal */}
      {showRefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-teal-400" />
                  Coronary Imaging &amp; Anatomical Reference
                </h3>
                <span className="text-xs text-slate-400">
                  Cardiac fluoroscopy X-ray, coronary tree angiography, and 3D exploded trajectories
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowRefModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Reference View Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setRefTab('xray')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  refTab === 'xray'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                Cardiac X-Ray Angiogram
              </button>
              <button
                type="button"
                onClick={() => setRefTab('tree')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  refTab === 'tree'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                Coronary Tree Fluoroscopy
              </button>
              <button
                type="button"
                onClick={() => setRefTab('exploded')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  refTab === 'exploded'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                Exploded 3D Schema
              </button>
            </div>

            <div className="flex justify-center p-2 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex-1 min-h-[300px]">
              {refTab === 'xray' && (
                <img
                  src="/images/heart_xray_angiogram.jpg"
                  alt="High-contrast cardiac X-ray angiogram showing heart silhouette and LAD, LCX, RCA coronary artery trajectories"
                  className="max-h-[460px] object-contain rounded-xl"
                />
              )}
              {refTab === 'tree' && (
                <img
                  src="/images/cardiac_angiography_tree.jpg"
                  alt="Coronary angiography arterial tree fluoroscopy X-ray view"
                  className="max-h-[460px] object-contain rounded-xl"
                />
              )}
              {refTab === 'exploded' && (
                <img
                  src="/images/heart_reference.jpg"
                  alt="Exploded-view human heart anatomy reference"
                  className="max-h-[460px] object-contain rounded-xl"
                />
              )}
            </div>

            <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <strong className="text-slate-200 block mb-0.5">Anatomical Correlation:</strong>
              Coronary artery branches correspond to the interactive 3D model: LAD (Left Anterior Descending), LCX (Left Circumflex), and RCA (Right Coronary Artery), alongside cardiac chambers (Atria, Ventricles, Aorta, Valves, and Myocardium).
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRefModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
