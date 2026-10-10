"use client";

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Sparkles, Torus, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles as SparklesIcon,
  RotateCcw,
  Undo2,
  CheckCircle2,
  HelpCircle,
  X,
  ArrowRight,
  Layers,
  Info,
  Atom,
  ChevronLeft,
  BookOpen,
  Target
} from 'lucide-react';
import {
  ORBITAL_COLORS,
  getOrbitalMaterial,
  getHybridLobeMaterial,
  getBackLobeMaterial,
  getNucleusMaterial
} from './materials';
import {
  HYBRID_STATES,
  getHybridDirections,
  getQuaternionFromDirection
} from './helpers';

type OrbitalType = 's' | 'px' | 'py' | 'pz' | 'd';

interface SelectedOrbitalItem {
  id: string;
  type: OrbitalType;
}

// ── 3D Atomic Orbital Component ──────────────────────────────────────────────
const AtomicOrbital3D = ({ type }: { type: OrbitalType }) => {
  const meshRef = useRef<THREE.Group>(null);
  const mat = useMemo(() => getOrbitalMaterial(type), [type]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  if (type === 's') {
    return (
      <group ref={meshRef}>
        <Sphere args={[1.25, 32, 32]} material={mat} />
        <Sphere args={[1.27, 16, 16]}>
          <meshBasicMaterial color="#a855f7" wireframe transparent opacity={0.15} />
        </Sphere>
      </group>
    );
  }

  if (type === 'px') {
    return (
      <group ref={meshRef}>
        <group position={[1.1, 0, 0]} scale={[1.4, 0.8, 0.8]}>
          <Sphere args={[0.75, 32, 32]} material={mat} />
        </group>
        <group position={[-1.1, 0, 0]} scale={[1.4, 0.8, 0.8]}>
          <Sphere args={[0.75, 32, 32]} material={mat} />
        </group>
      </group>
    );
  }

  if (type === 'py') {
    return (
      <group ref={meshRef}>
        <group position={[0, 1.1, 0]} scale={[0.8, 1.4, 0.8]}>
          <Sphere args={[0.75, 32, 32]} material={mat} />
        </group>
        <group position={[0, -1.1, 0]} scale={[0.8, 1.4, 0.8]}>
          <Sphere args={[0.75, 32, 32]} material={mat} />
        </group>
      </group>
    );
  }

  if (type === 'pz') {
    return (
      <group ref={meshRef}>
        <group position={[0, 0, 1.1]} scale={[0.8, 0.8, 1.4]}>
          <Sphere args={[0.75, 32, 32]} material={mat} />
        </group>
        <group position={[0, 0, -1.1]} scale={[0.8, 0.8, 1.4]}>
          <Sphere args={[0.75, 32, 32]} material={mat} />
        </group>
      </group>
    );
  }

  return (
    <group ref={meshRef}>
      <group position={[0.9, 0.9, 0]} scale={[1.0, 1.0, 0.7]}>
        <Sphere args={[0.65, 32, 32]} material={mat} />
      </group>
      <group position={[-0.9, -0.9, 0]} scale={[1.0, 1.0, 0.7]}>
        <Sphere args={[0.65, 32, 32]} material={mat} />
      </group>
      <group position={[-0.9, 0.9, 0]} scale={[1.0, 1.0, 0.7]}>
        <Sphere args={[0.65, 32, 32]} material={mat} />
      </group>
      <group position={[0.9, -0.9, 0]} scale={[1.0, 1.0, 0.7]}>
        <Sphere args={[0.65, 32, 32]} material={mat} />
      </group>
      <Torus args={[0.7, 0.22, 16, 32]} rotation={[Math.PI / 2, 0, 0]} material={mat} />
    </group>
  );
};

// ── 3D Single Hybrid Lobe Component ─────────────────────────────────────────
const HybridLobe3D = ({
  direction,
  index
}: {
  direction: THREE.Vector3;
  label?: string;
  index: number;
}) => {
  const norm = useMemo(() => direction.clone().normalize(), [direction]);
  const quaternion = useMemo(() => getQuaternionFromDirection(norm), [norm]);

  const lobeColors = ['#06b6d4', '#a855f7', '#3b82f6', '#f43f5e', '#22c55e', '#f97316'];
  const emissiveColors = ['#0891b2', '#7e22ce', '#1d4ed8', '#be185d', '#15803d', '#c2410c'];

  const colorHex = lobeColors[index % lobeColors.length];
  const emissiveHex = emissiveColors[index % emissiveColors.length];

  const mainMat = useMemo(() => getHybridLobeMaterial(colorHex, emissiveHex), [colorHex, emissiveHex]);
  const backMat = useMemo(() => getBackLobeMaterial(), []);

  return (
    <group quaternion={quaternion}>
      <group position={[0, 1.15, 0]} scale={[0.75, 1.45, 0.75]}>
        <Sphere args={[0.85, 32, 32]} material={mainMat} />
      </group>

      <group position={[0, -0.4, 0]} scale={[0.45, 0.45, 0.45]}>
        <Sphere args={[0.7, 24, 24]} material={backMat} />
      </group>
    </group>
  );
};

// ── 3D Direction Vector Component ──────────────────────────────────────────
const DirectionVector3D = ({
  direction,
  label,
  color = '#2563EB'
}: {
  direction: THREE.Vector3;
  label: string;
  color?: string;
}) => {
  const norm = useMemo(() => direction.clone().normalize(), [direction]);
  const length = 2.6;
  const labelPos = useMemo(() => norm.clone().multiplyScalar(length + 0.35), [norm, length]);
  const quaternion = useMemo(() => getQuaternionFromDirection(norm), [norm]);

  return (
    <group>
      <group quaternion={quaternion}>
        <mesh position={[0, length / 2, 0]}>
          <cylinderGeometry args={[0.025, 0.025, length, 16]} />
          <meshBasicMaterial color={color} opacity={0.85} transparent />
        </mesh>
        <mesh position={[0, length, 0]}>
          <coneGeometry args={[0.09, 0.25, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>

      <group position={[labelPos.x, labelPos.y, labelPos.z]}>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="bg-white/95 border border-sky-300 text-[#2563EB] px-2 py-0.5 rounded text-[10px] font-mono font-extrabold shadow-md backdrop-blur-md whitespace-nowrap">
            {label}
          </div>
        </Html>
      </group>
    </group>
  );
};

// ── 3D Floating Angle Indicators Overlay Component ─────────────────────────
const HybridAngle3DOverlays = ({ hybridCode }: { hybridCode: string }) => {
  if (hybridCode === 'sp') {
    return (
      <group>
        <group position={[0, 2.3, 0]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-amber-400 text-amber-800 px-3 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap animate-bounce">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Angle: 180° (Linear)</span>
            </div>
          </Html>
        </group>
      </group>
    );
  }

  if (hybridCode === 'sp2') {
    return (
      <group>
        <group position={[1.4, 1.4, 0]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-amber-400 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 whitespace-nowrap">
              <span>120°</span>
            </div>
          </Html>
        </group>
        <group position={[-1.7, 0.1, 0]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-amber-400 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 whitespace-nowrap">
              <span>120°</span>
            </div>
          </Html>
        </group>
      </group>
    );
  }

  if (hybridCode === 'sp3') {
    return (
      <group>
        <group position={[1.1, 1.5, 0.6]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-amber-400 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 whitespace-nowrap">
              <span>109.5°</span>
            </div>
          </Html>
        </group>
        <group position={[-1.1, -0.7, 1.0]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-amber-400 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 whitespace-nowrap">
              <span>109.5°</span>
            </div>
          </Html>
        </group>
      </group>
    );
  }

  if (hybridCode === 'sp3d') {
    return (
      <group>
        <group position={[1.2, 1.4, 0]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-sky-400 text-[#2563EB] px-2.5 py-0.5 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 whitespace-nowrap">
              <span>90°</span>
            </div>
          </Html>
        </group>
        <group position={[-1.3, -0.6, 1.1]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-amber-400 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 whitespace-nowrap">
              <span>120°</span>
            </div>
          </Html>
        </group>
      </group>
    );
  }

  if (hybridCode === 'sp3d2') {
    return (
      <group>
        <group position={[1.2, 1.4, 0]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-sky-400 text-[#2563EB] px-2.5 py-0.5 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 whitespace-nowrap">
              <span>90°</span>
            </div>
          </Html>
        </group>
        <group position={[-1.2, -0.6, 1.2]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-white border-2 border-sky-400 text-[#2563EB] px-2.5 py-0.5 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 whitespace-nowrap">
              <span>90°</span>
            </div>
          </Html>
        </group>
      </group>
    );
  }

  return null;
};

const getDirectionLabel = (code: string, idx: number): string => {
  if (code === 'sp') {
    return idx === 0 ? '0° Dir (+X)' : '180° Dir (-X)';
  }
  if (code === 'sp2') {
    return idx === 0 ? '0° Axis' : idx === 1 ? '120° Axis' : '240° Axis';
  }
  if (code === 'sp3') {
    return `Tetrahedral Vector ${idx + 1}`;
  }
  if (code === 'sp3d') {
    if (idx === 3) return 'Axial Top (+Y)';
    if (idx === 4) return 'Axial Bottom (-Y)';
    return `Equatorial ${idx + 1} (120°)`;
  }
  if (code === 'sp3d2') {
    if (idx === 2) return 'Axial Top (+Y)';
    if (idx === 3) return 'Axial Bottom (-Y)';
    if (idx === 0) return 'Equatorial +X (90°)';
    if (idx === 1) return 'Equatorial -X (90°)';
    if (idx === 4) return 'Equatorial +Z (90°)';
    if (idx === 5) return 'Equatorial -Z (90°)';
    return `Equatorial ${idx + 1} (90°)`;
  }
  return `Dir #${idx + 1}`;
};

const getDirectionColor = (idx: number): string => {
  const colors = ['#2563EB', '#a855f7', '#22c55e', '#ef4444', '#eab308', '#f97316'];
  return colors[idx % colors.length];
};

// ── 3D Scene Container ──────────────────────────────────────────────────────
const MixingZoneScene = ({
  selectedOrbitals,
  hybridState
}: {
  selectedOrbitals: SelectedOrbitalItem[];
  hybridState: typeof HYBRID_STATES[string];
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const nucleusMat = useMemo(() => getNucleusMaterial(), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const isHybridActive = hybridState.code !== 'none' && hybridState.code !== 's';
  const directions = useMemo(() => getHybridDirections(hybridState.code), [hybridState.code]);

  return (
    <group>
      {/* Pedestal Base Ring Platform in Light Clean Styling */}
      <group position={[0, -2.85, 0]}>
        <Cylinder args={[3.8, 4.2, 0.25, 64]}>
          <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.1} />
        </Cylinder>
        <Torus args={[3.9, 0.04, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#38A9E8" emissive="#38A9E8" emissiveIntensity={0.6} />
        </Torus>
        <Torus args={[3.1, 0.03, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
        </Torus>
      </group>

      {/* Floating Ambient Sparkles */}
      <Sparkles count={45} scale={7} size={2.5} speed={0.4} color="#38A9E8" />

      {/* Central Carbon Nucleus */}
      <Sphere args={[0.35, 32, 32]} position={[0, 0, 0]} material={nucleusMat}>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="text-white font-black text-xs select-none drop-shadow">
            C
          </div>
        </Html>
      </Sphere>

      {/* Orbitals Visualization Group */}
      <group ref={groupRef}>
        {isHybridActive ? (
          <>
            {directions.map((dir, idx) => (
              <React.Fragment key={`hybrid-grp-${hybridState.code}-${idx}`}>
                <HybridLobe3D
                  direction={dir}
                  index={idx}
                  label={`${hybridState.code} #${idx + 1}`}
                />
                <DirectionVector3D
                  direction={dir}
                  label={getDirectionLabel(hybridState.code, idx)}
                  color={getDirectionColor(idx)}
                />
              </React.Fragment>
            ))}

            <HybridAngle3DOverlays hybridCode={hybridState.code} />
          </>
        ) : (
          selectedOrbitals.map((item, idx) => {
            const offset: [number, number, number] =
              item.type === 's'
                ? [0, 0, 0]
                : item.type === 'px'
                  ? [0.2 * idx, 0, 0]
                  : item.type === 'py'
                    ? [0, 0.2 * idx, 0]
                    : item.type === 'pz'
                      ? [0, 0, 0.2 * idx]
                      : [0.3 * idx, 0.3 * idx, 0];

            return (
              <group key={item.id} position={offset}>
                <AtomicOrbital3D type={item.type} />
              </group>
            );
          })
        )}
      </group>
    </group>
  );
};

// ── Main Page Component ─────────────────────────────────────────────────────
export default function HybridizationGamePage({
  difficulty = 'easy'
}: {
  difficulty?: string;
}) {
  const router = useRouter();

  // Screen View Mode: intro mission target screen vs interactive single canvas mode
  const [gameStarted, setGameStarted] = useState(false);

  // Selected Orbitals State
  const [selectedOrbitals, setSelectedOrbitals] = useState<SelectedOrbitalItem[]>([]);
  const [hintOpen, setHintOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // Available Orbitals Counts (s=1, px=1, py=1, pz=1, d=2)
  const availableCounts = useMemo(() => {
    const sUsed = selectedOrbitals.filter((o) => o.type === 's').length;
    const pxUsed = selectedOrbitals.filter((o) => o.type === 'px').length;
    const pyUsed = selectedOrbitals.filter((o) => o.type === 'py').length;
    const pzUsed = selectedOrbitals.filter((o) => o.type === 'pz').length;
    const dUsed = selectedOrbitals.filter((o) => o.type === 'd').length;

    return {
      s: 1 - sUsed,
      px: 1 - pxUsed,
      py: 1 - pyUsed,
      pz: 1 - pzUsed,
      d: 2 - dUsed,
    };
  }, [selectedOrbitals]);

  // Derive Current Hybridization State
  const sCount = selectedOrbitals.filter((o) => o.type === 's').length;
  const pCount = selectedOrbitals.filter((o) => o.type === 'px' || o.type === 'py' || o.type === 'pz').length;
  const dCount = selectedOrbitals.filter((o) => o.type === 'd').length;

  const hybridStateKey = useMemo(() => {
    if (selectedOrbitals.length === 0) return 'none';
    if (sCount === 1 && pCount === 0 && dCount === 0) return 's';
    if (sCount === 1 && pCount === 1 && dCount === 0) return 'sp';
    if (sCount === 1 && pCount === 2 && dCount === 0) return 'sp2';
    if (sCount === 1 && pCount === 3 && dCount === 0) return 'sp3';
    if (sCount === 1 && pCount === 3 && dCount === 1) return 'sp3d';
    if (sCount === 1 && pCount === 3 && dCount === 2) return 'sp3d2';

    return 'invalid';
  }, [selectedOrbitals.length, sCount, pCount, dCount]);

  const currentHybridState = HYBRID_STATES[hybridStateKey] || HYBRID_STATES['none'];

  // Add Orbital Handler
  const handleAddOrbital = (type: OrbitalType) => {
    if (availableCounts[type] <= 0) return;

    if (type === 'd' && (sCount < 1 || pCount < 3)) {
      setErrorMessage('Hybridization order: Select 1 s and 3 p orbitals before adding d orbitals.');
      setTimeout(() => setErrorMessage(null), 4000);
    } else if ((type === 'px' || type === 'py' || type === 'pz') && sCount === 0) {
      setErrorMessage('Start with 1 s orbital first to begin hybridization.');
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setErrorMessage(null);
      setScore((prev) => prev + 15);
    }

    const newItem: SelectedOrbitalItem = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
    };
    setSelectedOrbitals((prev) => [...prev, newItem]);
  };

  // Revert One Step Handler
  const handleRevertStep = () => {
    if (selectedOrbitals.length === 0) return;
    setSelectedOrbitals((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  // Reset Handler
  const handleReset = () => {
    setSelectedOrbitals([]);
    setErrorMessage(null);
    setShowSuccessModal(false);
  };

  // Progress Bar Stages Definition
  const stages = [
    { code: 's', label: 's' },
    { code: 'sp', label: 'sp' },
    { code: 'sp2', label: 'sp²' },
    { code: 'sp3', label: 'sp³' },
    { code: 'sp3d', label: 'sp³d' },
    { code: 'sp3d2', label: 'sp³d²' },
  ];

  const isStageCompleted = (code: string) => {
    const stageOrder = ['s', 'sp', 'sp2', 'sp3', 'sp3d', 'sp3d2'];
    const currentIdx = stageOrder.indexOf(hybridStateKey);
    const targetIdx = stageOrder.indexOf(code);
    return currentIdx >= targetIdx && currentIdx !== -1 && targetIdx !== -1;
  };

  const isStageActive = (code: string) => hybridStateKey === code;

  const handleDragStart = (e: React.DragEvent, type: OrbitalType) => {
    e.dataTransfer.setData('text/plain', type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain') as OrbitalType;
    if (type && ['s', 'px', 'py', 'pz', 'd'].includes(type)) {
      handleAddOrbital(type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col">
      
      {/* ── SCREEN 1: INTRO MISSION TARGET OVERLAY VIEW (BLURRED BACKGROUND) ───── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-6 bg-white/40 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#2563EB]" />
            </button>
          </div>

          {/* Central Target Text & Start Mission Button */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-5 z-10 px-2 sm:px-4 py-2">
            <div className="text-[#2563EB] text-[10px] sm:text-sm font-mono font-bold tracking-[0.25em] uppercase">
              HYBRIDIZATION & ORBITAL OVERLAP
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              <span className="text-[#2563EB]">TARGET:</span> Mix s, p & d atomic orbitals to construct hybrid orbital geometries (sp to sp³d²)
            </h1>

            <div className="pt-1 sm:pt-4">
              <button
                onClick={() => setGameStarted(true)}
                className="px-6 py-2 sm:px-8 sm:py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-lg border border-blue-400 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                START MISSION
              </button>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="text-center text-[10px] sm:text-xs text-[#64748B] z-10 shrink-0">
            Click Start Mission to launch the single canvas orbital workshop
          </div>
        </div>
      )}

      {/* ── SCREEN 2: ACTIVE SINGLE CANVAS INTERACTIVE VIEW ───────────────────── */}
      <div className={`flex-1 flex flex-col justify-between p-3 sm:p-4 overflow-hidden relative bg-[#F8FAFC] transition-all duration-300 ${!gameStarted ? 'filter blur-sm pointer-events-none select-none opacity-70' : ''}`}>

        {/* ── 1. TOP FLOATING NAVIGATION BAR ─────────────────────────────────── */}
        <div className="w-full flex items-center justify-between z-20 shrink-0 mb-2 gap-2 flex-wrap sm:flex-nowrap">
          {/* Top Left: Back Button & Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="h-9 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 text-[#1E293B] font-extrabold text-xs transition-all shadow-md cursor-pointer"
              title="Back to Topics"
            >
              <ChevronLeft className="w-4 h-4 text-[#2563EB]" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <button
              onClick={handleRevertStep}
              disabled={selectedOrbitals.length === 0}
              className={`h-9 px-3 rounded-xl border font-bold text-xs transition-all flex items-center gap-1 shadow-md ${
                selectedOrbitals.length > 0
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 cursor-pointer'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
              }`}
              title="Revert Step"
            >
              <Undo2 className="w-4 h-4" />
              <span className="hidden sm:inline">Revert</span>
            </button>

            <button
              onClick={handleReset}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-md cursor-pointer"
              title="Reset Workshop"
            >
              <RotateCcw className="w-4 h-4 text-[#64748B]" />
            </button>
          </div>

          {/* Top Center: Hybrid Stage Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
            {stages.map((stg) => {
              const completed = isStageCompleted(stg.code);
              const active = isStageActive(stg.code);

              return (
                <div
                  key={stg.code}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold transition-all cursor-default select-none ${
                    completed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : active
                        ? 'bg-blue-100 text-[#2563EB] border border-blue-300 ring-2 ring-blue-300/40'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-[#2563EB] animate-ping' : 'bg-slate-400'}`} />
                  )}
                  <span>{stg.label}</span>
                </div>
              );
            })}
          </div>

          {/* Top Right: Explanation Button & Score */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowSuccessModal(true)}
              className="h-9 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-2 text-purple-700 text-xs font-bold transition-all shadow-md cursor-pointer"
              title="View Theory & Explanation"
            >
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Explanation</span>
            </button>

            <button
              onClick={() => setHintOpen(true)}
              className="h-9 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#2563EB] text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-[#2563EB]" />
              <span className="hidden sm:inline">Hint</span>
            </button>

            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-800 font-extrabold text-xs shadow-sm">
              <span>⭐</span>
              <span>{score}</span>
            </div>
          </div>
        </div>

        {/* ── 2. MAIN 3D WORKSHOP CANVAS ───────────────────────────────────── */}
        <main
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 w-full min-h-[200px] relative bg-[#F8FAFC] border border-slate-200 rounded-2xl overflow-hidden shadow-inner z-10 shrink"
        >
          <Canvas
            camera={{ position: [0, 2.2, 11.5], fov: 45 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={1.1} />
            <directionalLight position={[5, 10, 7]} intensity={1.5} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} color="#a855f7" />
            <pointLight position={[0, 4, 0]} intensity={1.0} color="#38A9E8" />

            <MixingZoneScene
              selectedOrbitals={selectedOrbitals}
              hybridState={currentHybridState}
            />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              minDistance={4}
              maxDistance={20}
            />
          </Canvas>

          {/* Empty State Overlay */}
          {selectedOrbitals.length === 0 && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] mb-1.5 shadow-md animate-bounce">
                <Atom className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-[#1E293B] tracking-wide mb-0.5">Mixing Zone</h3>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                Select or drag an orbital from the bottom panel to begin hybridization.
              </p>
            </div>
          )}

          {/* Error Notification Toast */}
          {errorMessage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-2 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 animate-bounce">
              <Info className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold">{errorMessage}</span>
            </div>
          )}

          {/* Current Hybrid Target Status Card (Top-Left Canvas Overlay) */}
          {currentHybridState.code !== 'none' && (
            <div className="absolute top-3 left-3 z-20 bg-white/95 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] animate-pulse shrink-0" />
              <div className="text-left">
                <div className="text-xs font-black text-[#1E293B] flex items-center gap-2">
                  <span className="text-[#2563EB] text-sm font-mono">{currentHybridState.name}</span>
                  {currentHybridState.angles !== 'N/A' && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
                      {currentHybridState.angles}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-purple-700 font-bold">
                  {currentHybridState.geometryName}
                </div>
              </div>
            </div>
          )}

          {/* Floating Top-Right Required Orbitals Guide */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 border border-slate-200 rounded-xl px-3.5 py-2 shadow-md backdrop-blur-md text-xs text-[#1E293B] hidden sm:flex items-center gap-2">
            <span className="text-[#64748B] font-bold">Required:</span>
            <span className="font-mono text-amber-800 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {hybridStateKey === 'sp' ? '1 s + 1 p' :
                hybridStateKey === 'sp2' ? '1 s + 2 p' :
                  hybridStateKey === 'sp3' ? '1 s + 3 p' :
                    hybridStateKey === 'sp3d' ? '1 s + 3 p + 1 d' :
                      hybridStateKey === 'sp3d2' ? '1 s + 3 p + 2 d' : '1 s orbital first'}
            </span>
          </div>
        </main>

        {/* ── 3. FLOATING BOTTOM CONTROL DOCK & TARGET INSTRUCTIONS ──────────────── */}
        <div className="w-full flex flex-col items-center gap-2 z-20 shrink-0 pt-2 border-t border-slate-200">
          {/* Target Instruction Pill (Bottom Line) */}
          <div className="flex items-center gap-2 bg-white border border-[#38A9E8]/40 px-4 py-1.5 rounded-full text-[#1E293B] text-xs font-extrabold shadow-md">
            <Target className="w-4 h-4 text-[#2563EB]" />
            <span>
              TARGET: Select or Drag Orbitals into the Mixing Zone (1 s → 3 p → 2 d)
            </span>
          </div>

          {/* Bottom Dock Control Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-lg flex items-center justify-between max-w-4xl w-full gap-2 flex-wrap">
            <div className="flex items-center gap-2 max-w-full overflow-x-auto">
              <div className="flex items-center gap-1 text-[#2563EB] text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200 shrink-0">
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Orbitals Tray:</span>
              </div>

              {/* Orbital Tray Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-full">
                {/* s orbital */}
                <div
                  draggable={availableCounts.s > 0}
                  onDragStart={(e) => handleDragStart(e, 's')}
                  onClick={() => handleAddOrbital('s')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                    availableCounts.s > 0
                      ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                      : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                    s
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#1E293B]">s orbital</div>
                    <div className="text-[9px] text-[#64748B]">Spherical</div>
                  </div>
                  <span className="text-[9.5px] font-mono bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-md font-bold">
                    ×{availableCounts.s}
                  </span>
                </div>

                {/* px orbital */}
                <div
                  draggable={availableCounts.px > 0}
                  onDragStart={(e) => handleDragStart(e, 'px')}
                  onClick={() => handleAddOrbital('px')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                    availableCounts.px > 0
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                      : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#22C55E] text-white font-bold text-[10px] flex items-center justify-center">
                    pₓ
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#1E293B]">pₓ orbital</div>
                    <div className="text-[9px] text-[#64748B]">X-axis</div>
                  </div>
                  <span className="text-[9.5px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md font-bold">
                    ×{availableCounts.px}
                  </span>
                </div>

                {/* py orbital */}
                <div
                  draggable={availableCounts.py > 0}
                  onDragStart={(e) => handleDragStart(e, 'py')}
                  onClick={() => handleAddOrbital('py')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                    availableCounts.py > 0
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                      : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#22C55E] text-white font-bold text-[10px] flex items-center justify-center">
                    pᵧ
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#1E293B]">pᵧ orbital</div>
                    <div className="text-[9px] text-[#64748B]">Y-axis</div>
                  </div>
                  <span className="text-[9.5px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md font-bold">
                    ×{availableCounts.py}
                  </span>
                </div>

                {/* pz orbital */}
                <div
                  draggable={availableCounts.pz > 0}
                  onDragStart={(e) => handleDragStart(e, 'pz')}
                  onClick={() => handleAddOrbital('pz')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                    availableCounts.pz > 0
                      ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900'
                      : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white font-bold text-[10px] flex items-center justify-center">
                    p𝓏
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#1E293B]">p𝓏 orbital</div>
                    <div className="text-[9px] text-[#64748B]">Z-axis</div>
                  </div>
                  <span className="text-[9.5px] font-mono bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded-md font-bold">
                    ×{availableCounts.pz}
                  </span>
                </div>

                {/* d orbital */}
                <div
                  draggable={availableCounts.d > 0}
                  onDragStart={(e) => handleDragStart(e, 'd')}
                  onClick={() => handleAddOrbital('d')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                    availableCounts.d > 0
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                      : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                    d
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#1E293B]">d orbital</div>
                    <div className="text-[9px] text-[#64748B]">Complex d</div>
                  </div>
                  <span className="text-[9.5px] font-mono bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-bold">
                    ×{availableCounts.d}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button on Complete */}
            {hybridStateKey === 'sp3d2' && (
              <button
                onClick={() => setShowSuccessModal(true)}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
              >
                <span>View Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── HINT MODAL DIALOG ──────────────────────────────────────────────── */}
      {hintOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 text-[#1E293B]">
            <button
              onClick={() => setHintOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 text-[#64748B] hover:text-[#1E293B]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1E293B]">Hybridization Hint</h3>
                <p className="text-xs text-[#64748B]">Step-by-step guidance</p>
              </div>
            </div>

            <div className="text-xs text-[#1E293B] space-y-2 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono">
              <p>• <strong>sp:</strong> Select 1 s + 1 p orbital (Linear, 180°).</p>
              <p>• <strong>sp²:</strong> Add a 2nd p orbital (Trigonal Planar, 120°).</p>
              <p>• <strong>sp³:</strong> Add a 3rd p orbital (Tetrahedral, 109.5°).</p>
              <p>• <strong>sp³d:</strong> Add 1 d orbital (Trigonal Bipyramidal).</p>
              <p>• <strong>sp³d²:</strong> Add a 2nd d orbital (Octahedral, 90°).</p>
            </div>

            <button
              onClick={() => setHintOpen(false)}
              className="mt-5 w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* ── THEORY & EXPLANATION MODAL DRAWER ──────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-6">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full flex flex-col max-h-[calc(100vh-7rem)] shadow-2xl overflow-hidden relative text-[#1E293B]">
            
            {/* Sticky Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B]">Hybrid Orbital Geometries & Theory</h3>
                  <p className="text-xs text-[#64748B]">Understanding orbital mixing, geometry, and 3D bond angles</p>
                </div>
              </div>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="p-2 rounded-full bg-slate-100 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200 transition-all cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* sp */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#2563EB] font-black text-sm font-mono">sp</span>
                    <span className="text-[#1E293B] text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Linear (180°)</span>
                  </div>
                  <div className="w-full flex items-center justify-center py-2 bg-white rounded-xl border border-slate-200 my-1.5">
                    <svg viewBox="0 0 120 50" className="w-36 h-12">
                      <path d="M 60 28 C 42 14, 15 14, 15 28 C 15 42, 42 42, 60 28 Z" fill="#06b6d4" fillOpacity="0.8" stroke="#0284c7" strokeWidth="1" />
                      <path d="M 60 28 C 78 14, 105 14, 105 28 C 105 42, 78 42, 60 28 Z" fill="#3b82f6" fillOpacity="0.8" stroke="#1d4ed8" strokeWidth="1" />
                      <circle cx="60" cy="28" r="4.5" fill="#2563EB" />
                    </svg>
                  </div>
                  <div className="text-[11px] text-[#64748B] flex justify-between font-mono pt-1 border-t border-slate-200">
                    <span>1s + 1p</span>
                    <span className="text-[#2563EB] font-bold">2 Hybrid Lobes</span>
                  </div>
                </div>

                {/* sp2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#2563EB] font-black text-sm font-mono">sp²</span>
                    <span className="text-[#1E293B] text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Trigonal Planar (120°)</span>
                  </div>
                  <div className="w-full flex items-center justify-center py-1.5 bg-white rounded-xl border border-slate-200 my-1.5">
                    <svg viewBox="0 0 100 80" className="w-28 h-14">
                      <path d="M 50 40 C 38 25, 38 5, 50 5 C 62 5, 62 25, 50 40 Z" fill="#22c55e" fillOpacity="0.75" stroke="#16a34a" strokeWidth="1" />
                      <path d="M 50 40 C 65 38, 85 50, 78 61 C 71 72, 53 52, 50 40 Z" fill="#3b82f6" fillOpacity="0.75" stroke="#1d4ed8" strokeWidth="1" />
                      <path d="M 50 40 C 35 38, 15 50, 22 61 C 29 72, 47 52, 50 40 Z" fill="#a855f7" fillOpacity="0.75" stroke="#7e22ce" strokeWidth="1" />
                      <circle cx="50" cy="40" r="4" fill="#2563EB" />
                    </svg>
                  </div>
                  <div className="text-[11px] text-[#64748B] flex justify-between font-mono pt-1 border-t border-slate-200">
                    <span>1s + 2p</span>
                    <span className="text-[#2563EB] font-bold">3 Hybrid Lobes</span>
                  </div>
                </div>

                {/* sp3 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#2563EB] font-black text-sm font-mono">sp³</span>
                    <span className="text-[#1E293B] text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Tetrahedral (109.5°)</span>
                  </div>
                  <div className="w-full flex items-center justify-center py-1.5 bg-white rounded-xl border border-slate-200 my-1.5">
                    <svg viewBox="0 0 100 80" className="w-28 h-14">
                      <path d="M 50 40 C 40 25, 40 5, 50 5 C 60 5, 60 25, 50 40 Z" fill="#3b82f6" fillOpacity="0.8" stroke="#1d4ed8" strokeWidth="1" />
                      <path d="M 50 40 C 58 35, 75 35, 70 47 C 65 55, 54 44, 50 40 Z" fill="#f43f5e" fillOpacity="0.5" stroke="#e11d48" strokeWidth="1" />
                      <path d="M 50 40 C 35 42, 15 55, 22 68 C 30 78, 45 55, 50 40 Z" fill="#a855f7" fillOpacity="0.8" stroke="#7e22ce" strokeWidth="1" />
                      <path d="M 50 40 C 65 42, 85 55, 78 68 C 70 78, 55 55, 50 40 Z" fill="#22c55e" fillOpacity="0.8" stroke="#16a34a" strokeWidth="1" />
                      <circle cx="50" cy="40" r="4" fill="#2563EB" />
                    </svg>
                  </div>
                  <div className="text-[11px] text-[#64748B] flex justify-between font-mono pt-1 border-t border-slate-200">
                    <span>1s + 3p</span>
                    <span className="text-[#2563EB] font-bold">4 Hybrid Lobes</span>
                  </div>
                </div>

                {/* sp3d */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#2563EB] font-black text-sm font-mono">sp³d</span>
                    <span className="text-[#1E293B] text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Trigonal Bipyramidal</span>
                  </div>
                  <div className="w-full flex items-center justify-center py-1.5 bg-white rounded-xl border border-slate-200 my-1.5">
                    <svg viewBox="0 0 100 85" className="w-28 h-14">
                      <path d="M 50 42 C 40 28, 40 5, 50 5 C 60 5, 60 28, 50 42 Z" fill="#3b82f6" fillOpacity="0.85" stroke="#1d4ed8" strokeWidth="1" />
                      <path d="M 50 42 C 40 56, 40 79, 50 79 C 60 79, 60 56, 50 42 Z" fill="#f43f5e" fillOpacity="0.85" stroke="#e11d48" strokeWidth="1" />
                      <circle cx="50" cy="42" r="4" fill="#2563EB" />
                    </svg>
                  </div>
                  <div className="text-[11px] text-[#64748B] flex justify-between font-mono pt-1 border-t border-slate-200">
                    <span>1s + 3p + 1d</span>
                    <span className="text-[#2563EB] font-bold">5 Hybrid Lobes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-[#1E293B] font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                Replay Workshop
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Resume Workshop
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
