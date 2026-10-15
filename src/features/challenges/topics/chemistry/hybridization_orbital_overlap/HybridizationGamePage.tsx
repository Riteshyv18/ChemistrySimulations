"use client";

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Sparkles, Torus } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles as SparklesIcon,
  RotateCcw,
  Undo2,
  CheckCircle2,
  HelpCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Layers,
  Info,
  Atom,
  ChevronLeft,
  ChevronRight,
  Play,
  BookOpen,
  Target,
  Eye
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';
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
// ── 3D Direction Vector Component (Small Arrow, Positioned Outside Lobes) ────
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
  const length = 2.65;
  const labelPos = useMemo(() => norm.clone().multiplyScalar(length + 0.35), [norm, length]);
  const quaternion = useMemo(() => getQuaternionFromDirection(norm), [norm]);

  // If vector is pointing forward towards the camera, hide the text badge
  // so it NEVER covers the central nucleus or the front 3D lobes!
  const isFacingFront = norm.z > 0.45;

  return (
    <group>
      {/* Sleek axis stem and visible small arrow cone */}
      <group quaternion={quaternion}>
        <mesh position={[0, length / 2, 0]}>
          <cylinderGeometry args={[0.016, 0.016, length, 16]} />
          <meshBasicMaterial color={color} opacity={0.65} transparent />
        </mesh>
        <mesh position={[0, length, 0]}>
          <coneGeometry args={[0.08, 0.22, 16]} />
          <meshBasicMaterial color={color} opacity={0.95} />
        </mesh>
      </group>

      {/* Small neat transparent axis indicator outside the lobe */}
      {!isFacingFront && (
        <group position={[labelPos.x, labelPos.y, labelPos.z]}>
          <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
            <div className="bg-sky-500/10 border border-sky-400/40 text-blue-900/90 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold whitespace-nowrap select-none">
              {label}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

// ── 3D Floating Angle Indicators Component (Transparent in Open Quadrants) ────
const HybridAngle3DOverlays = ({ hybridCode }: { hybridCode: string }) => {
  if (hybridCode === 'sp') {
    return (
      <group position={[0, 2.3, 0]}>
        <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-400/40 text-amber-950 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap select-none">
            <span className="text-amber-600 font-bold">⟵</span>
            <span>180°</span>
            <span className="text-amber-600 font-bold">⟶</span>
          </div>
        </Html>
      </group>
    );
  }

  if (hybridCode === 'sp2') {
    return (
      <group position={[1.4, 1.4, 0]}>
        <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-400/40 text-amber-950 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap select-none">
            <span className="text-amber-600 font-bold">⟵</span>
            <span>120°</span>
            <span className="text-amber-600 font-bold">⟶</span>
          </div>
        </Html>
      </group>
    );
  }

  if (hybridCode === 'sp3') {
    return (
      <group position={[1.3, 1.5, 0.4]}>
        <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-400/40 text-amber-950 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap select-none">
            <span className="text-amber-600 font-bold">⟵</span>
            <span>109.5°</span>
            <span className="text-amber-600 font-bold">⟶</span>
          </div>
        </Html>
      </group>
    );
  }

  if (hybridCode === 'sp3d') {
    return (
      <group>
        <group position={[1.4, 1.4, 0]}>
          <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
            <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-400/40 text-blue-900 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap select-none">
              <span className="text-sky-600 font-bold">⟵</span>
              <span>90°</span>
              <span className="text-sky-600 font-bold">⟶</span>
            </div>
          </Html>
        </group>
        <group position={[-1.5, 0, 1.3]}>
          <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-400/40 text-amber-950 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap select-none">
              <span className="text-amber-600 font-bold">⟵</span>
              <span>120°</span>
              <span className="text-amber-600 font-bold">⟶</span>
            </div>
          </Html>
        </group>
      </group>
    );
  }

  if (hybridCode === 'sp3d2') {
    return (
      <group position={[1.4, 1.4, 0]}>
        <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-400/40 text-blue-900 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap select-none">
            <span className="text-sky-600 font-bold">⟵</span>
            <span>90°</span>
            <span className="text-sky-600 font-bold">⟶</span>
          </div>
        </Html>
      </group>
    );
  }

  return null;
};

const getDirectionLabel = (code: string, idx: number): string => {
  if (code === 'sp') {
    return idx === 0 ? '+X' : '-X';
  }
  if (code === 'sp2') {
    return idx === 0 ? '0°' : idx === 1 ? '120°' : '240°';
  }
  if (code === 'sp3') {
    return `Axis ${idx + 1}`;
  }
  if (code === 'sp3d') {
    if (idx === 3) return 'Axial (+Y)';
    if (idx === 4) return 'Axial (-Y)';
    return `Eq ${idx + 1}`;
  }
  if (code === 'sp3d2') {
    if (idx === 2) return 'Axial (+Y)';
    if (idx === 3) return 'Axial (-Y)';
    if (idx === 0) return 'Eq (+X)';
    if (idx === 1) return 'Eq (-X)';
    if (idx === 4) return 'Eq (+Z)';
    if (idx === 5) return 'Eq (-Z)';
    return `Eq ${idx + 1}`;
  }
  return `Axis ${idx + 1}`;
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
    <group position={[0, -0.15, 0]}>
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
  difficulty = 'level1',
  onExit
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  const router = useRouter();

  // Screen View Mode: intro mission target screen vs instructions vs interactive single canvas mode
  const [gameStarted, setGameStarted] = useState(false);
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');

  // Selected Orbitals State
  const [selectedOrbitals, setSelectedOrbitals] = useState<SelectedOrbitalItem[]>([]);
  const [hintOpen, setHintOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showHud, setShowHud] = useState(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

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
      
      {/* ── SCREEN 1: INTRO MISSION & INSTRUCTIONS OVERLAY VIEW (BLURRED BACKGROUND) ───── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-6 bg-white/40 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION OVERVIEW */}
          {introStep === 'mission' && (
            <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-4 z-10 px-2 sm:px-4 py-2 w-full">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                HYBRIDIZATION & ORBITAL OVERLAP
              </div>

              <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
                <span className="text-[#2563EB]">MISSION:</span> Mix s, p & d atomic orbitals to construct hybrid orbital geometries (sp to sp³d²)
              </h1>

              {/* Next Button */}
              <div className="pt-2 sm:pt-4">
                <button
                  onClick={() => setIntroStep('instructions')}
                  className="px-8 sm:px-10 py-2.5 sm:py-3 bg-gradient-to-r from-teal-800 to-cyan-900 hover:from-teal-700 hover:to-cyan-800 text-teal-200 hover:text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-lg border border-teal-400/50 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-teal-300" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INSTRUCTIONS TO PLAY */}
          {introStep === 'instructions' && (
            <div className="max-w-2xl mx-auto my-auto text-center space-y-2 sm:space-y-3 z-10 px-2 sm:px-4 py-1 w-full animate-in fade-in duration-200">
              <div className="text-black text-base sm:text-lg md:text-xl font-black tracking-wide">
                Instructions
              </div>

              {/* 1 Instruction Point as requested by user */}
              <div className="space-y-1.5 sm:space-y-2 text-left max-w-xl mx-auto w-full">
                <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-3 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2.5 transition-all hover:border-blue-300">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] sm:text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <p className="font-extrabold text-[12px] sm:text-sm text-[#1E293B] leading-tight">
                      Tap on the s, p, and d orbitals to see the shape and Hybridization.
                    </p>
                  </div>
                  <div className="w-16 sm:w-24 md:w-28 h-9 sm:h-11 md:h-12 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                    <img
                      src="/images/hybridization/l1_step1_tap_orbitals.svg"
                      alt="Tap orbitals instruction"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play */}
              <div className="pt-2 sm:pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => setIntroStep('mission')}
                  className="px-5 sm:px-7 py-1.5 sm:py-2 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>BACK</span>
                </button>

                <button
                  onClick={() => setGameStarted(true)}
                  className="px-7 sm:px-9 py-1.5 sm:py-2 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Footer Note (Only on mission step to preserve space) */}
          {introStep === 'mission' && (
            <div className="w-full text-center text-[10px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0">
              Click NEXT to view challenge instructions
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN 2: ACTIVE SINGLE CANVAS INTERACTIVE VIEW ───────────────────── */}
      <div className={`flex-1 flex flex-col justify-between p-3 sm:p-4 overflow-hidden relative bg-[#F8FAFC] transition-all duration-300 ${!gameStarted ? 'filter blur-sm pointer-events-none select-none opacity-70' : ''}`}>

        {/* ── 1. TOP FLOATING NAVIGATION BAR ─────────────────────────────────── */}
        <div className="w-full flex items-center justify-between z-20 shrink-0 mb-2 gap-2 flex-wrap sm:flex-nowrap">
          {/* Top Left: Exit Button Only */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation (Back to App)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
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

          {/* Top Right: Explanation Button Only */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSuccessModal(true)}
              className="h-9 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-2 text-purple-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="View Theory & Explanation"
            >
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Explanation</span>
            </button>
          </div>
        </div>

        {/* ── 2. MAIN 3D WORKSHOP CANVAS ───────────────────────────────────── */}
        <main
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 w-full min-h-[200px] relative bg-[#F8FAFC] border border-slate-200 rounded-2xl overflow-hidden shadow-inner z-10 shrink"
        >
          <Canvas
            camera={{ position: [0, 0.4, 8.4], fov: 45 }}
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
              target={[0, -0.15, 0]}
              enablePan={true}
              enableZoom={true}
              minDistance={3.5}
              maxDistance={16}
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

          {/* Revert Button on Wrong Order Selection (Top-Right Canvas Overlay) */}
          {(hybridStateKey === 'invalid' || !!errorMessage) && selectedOrbitals.length > 0 && (
            <div className="absolute top-3 right-3 z-20 animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={handleRevertStep}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 text-amber-900 font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                title="Revert wrong orbital selection"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>REVERT</span>
              </button>
            </div>
          )}



          {/* Target Completed Rectangle Box (Top-Right Canvas Overlay) */}
          {hybridStateKey === 'sp3d2' && (
            <div className="absolute top-3 right-3 z-20 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
              <div className="bg-emerald-600/85 border border-emerald-400/60 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2.5 select-none">
                <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-black uppercase tracking-wider text-emerald-100 leading-tight">
                    Target Completed (100%)
                  </div>
                  <div className="text-[10px] font-medium text-white/95 leading-tight">
                    You opened all Hybridizations (s to sp³d²)!
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── 3. FLOATING BOTTOM CONTROL DOCK (ADJUSTABLE, RESPONSIVE 5-ORBITAL TRAY) ───────── */}
        <div className="w-full flex justify-center items-center z-20 shrink-0 p-1 sm:p-2 border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
          {/* Bottom Dock Control Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 sm:p-2 shadow-sm w-full max-w-5xl flex items-center gap-1.5 sm:gap-2.5">
            {/* Tray Title */}
            <div className="flex items-center gap-1 text-[#2563EB] text-[10px] sm:text-xs font-extrabold uppercase tracking-wider bg-blue-50 px-2 sm:px-2.5 py-1.5 rounded-xl border border-blue-200 shrink-0 select-none">
              <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="hidden sm:inline">Orbitals Tray:</span>
              <span className="sm:hidden">Tray:</span>
            </div>

            {/* 5 Orbitals in an adjustable, perfectly spaced grid */}
            <div className="flex-1 grid grid-cols-5 gap-1 sm:gap-2 min-w-0">
              {/* s orbital */}
              <div
                draggable={availableCounts.s > 0}
                onDragStart={(e) => handleDragStart(e, 's')}
                onClick={() => handleAddOrbital('s')}
                className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1 sm:gap-1.5 min-w-0 shadow-xs active:scale-95 select-none ${
                  availableCounts.s > 0
                    ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                    : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                }`}
                title="s orbital (Spherical)"
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-600 text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0">
                    s
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] sm:text-xs font-extrabold text-[#1E293B] whitespace-nowrap">
                      s <span className="hidden md:inline font-semibold text-slate-500">orbital</span>
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-[#64748B] hidden xl:block truncate">Spherical</div>
                  </div>
                </div>
                <span className="text-[8.5px] sm:text-[10px] font-mono bg-purple-200 text-purple-900 px-1 sm:px-1.5 py-0.5 rounded-md font-bold shrink-0">
                  ×{availableCounts.s}
                </span>
              </div>

              {/* px orbital */}
              <div
                draggable={availableCounts.px > 0}
                onDragStart={(e) => handleDragStart(e, 'px')}
                onClick={() => handleAddOrbital('px')}
                className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1 sm:gap-1.5 min-w-0 shadow-xs active:scale-95 select-none ${
                  availableCounts.px > 0
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                    : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                }`}
                title="px orbital (X-axis)"
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#22C55E] text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0">
                    pₓ
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] sm:text-xs font-extrabold text-[#1E293B] whitespace-nowrap">
                      pₓ <span className="hidden md:inline font-semibold text-slate-500">orbital</span>
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-[#64748B] hidden xl:block truncate">X-axis</div>
                  </div>
                </div>
                <span className="text-[8.5px] sm:text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1 sm:px-1.5 py-0.5 rounded-md font-bold shrink-0">
                  ×{availableCounts.px}
                </span>
              </div>

              {/* py orbital */}
              <div
                draggable={availableCounts.py > 0}
                onDragStart={(e) => handleDragStart(e, 'py')}
                onClick={() => handleAddOrbital('py')}
                className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1 sm:gap-1.5 min-w-0 shadow-xs active:scale-95 select-none ${
                  availableCounts.py > 0
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                    : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                }`}
                title="py orbital (Y-axis)"
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#22C55E] text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0">
                    pᵧ
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] sm:text-xs font-extrabold text-[#1E293B] whitespace-nowrap">
                      pᵧ <span className="hidden md:inline font-semibold text-slate-500">orbital</span>
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-[#64748B] hidden xl:block truncate">Y-axis</div>
                  </div>
                </div>
                <span className="text-[8.5px] sm:text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1 sm:px-1.5 py-0.5 rounded-md font-bold shrink-0">
                  ×{availableCounts.py}
                </span>
              </div>

              {/* pz orbital */}
              <div
                draggable={availableCounts.pz > 0}
                onDragStart={(e) => handleDragStart(e, 'pz')}
                onClick={() => handleAddOrbital('pz')}
                className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1 sm:gap-1.5 min-w-0 shadow-xs active:scale-95 select-none ${
                  availableCounts.pz > 0
                    ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900'
                    : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                }`}
                title="pz orbital (Z-axis)"
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#2563EB] text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0">
                    p𝓏
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] sm:text-xs font-extrabold text-[#1E293B] whitespace-nowrap">
                      p𝓏 <span className="hidden md:inline font-semibold text-slate-500">orbital</span>
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-[#64748B] hidden xl:block truncate">Z-axis</div>
                  </div>
                </div>
                <span className="text-[8.5px] sm:text-[10px] font-mono bg-blue-200 text-blue-900 px-1 sm:px-1.5 py-0.5 rounded-md font-bold shrink-0">
                  ×{availableCounts.pz}
                </span>
              </div>

              {/* d orbital */}
              <div
                draggable={availableCounts.d > 0}
                onDragStart={(e) => handleDragStart(e, 'd')}
                onClick={() => handleAddOrbital('d')}
                className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1 sm:gap-1.5 min-w-0 shadow-xs active:scale-95 select-none ${
                  availableCounts.d > 0
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                    : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                }`}
                title="d orbital (Complex d)"
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0">
                    d
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] sm:text-xs font-extrabold text-[#1E293B] whitespace-nowrap">
                      d <span className="hidden md:inline font-semibold text-slate-500">orbital</span>
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-[#64748B] hidden xl:block truncate">Complex d</div>
                  </div>
                </div>
                <span className="text-[8.5px] sm:text-[10px] font-mono bg-amber-200 text-amber-900 px-1 sm:px-1.5 py-0.5 rounded-md font-bold shrink-0">
                  ×{availableCounts.d}
                </span>
              </div>
            </div>
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

      {/* ── THEORY / EXPLANATION PAGE (FULL CANVAS / WHOLE SCREEN) ── */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                Hybridization &amp; Orbital Overlap Guide
              </h2>
              <p className="text-xs text-neutral-600 font-normal">
                Atomic Orbitals (s, p, d), LCAO Mixing, 3D Geometries, and Bond Angles
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-semibold text-xs transition-all cursor-pointer border border-neutral-300 active:scale-95"
            >
              <X className="w-4 h-4 text-black" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-7 space-y-6 sm:space-y-8 text-black text-xs sm:text-sm leading-relaxed max-w-3xl mx-auto w-full">
            
            {/* Section 1: Core Principle */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                1. Core Principle of Orbital Hybridization (LCAO Theory)
              </h3>
              <p className="text-black leading-relaxed">
                <strong>Orbital Hybridization</strong> is the mathematical linear combination (mixing) of non-equivalent atomic wavefunctions (s, p, and d) on the same central atom to create a brand new set of equivalent, degenerate hybrid wavefunctions.
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Fundamental Characteristics:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Energy Equalization &amp; Repulsion Minimization:</strong> Pure unhybridized s and p orbitals possess different energies and fixed 90° orientations. Mixing them creates equalized hybrid orbitals that spread symmetrically across 3D space (180°, 120°, 109.5°, 90°) to maximize inter-electron distances and minimize mutual repulsion.
                </li>
                <li>
                  <strong>Directional Front Lobe Advantage (Stronger σ Bonds):</strong> Each hybrid orbital features an asymmetric lobe structure—one large concentrated front lobe and a tiny back lobe. This concentrates electron probability forward along the bonding axis, yielding far stronger head-on coaxial <strong>sigma (σ) covalent bonds</strong>.
                </li>
              </ul>
            </div>

            {/* Section 2: Fundamental Atomic Orbitals (s, p, d) */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                2. The Pure Atomic Orbital Building Blocks: s, p, and d
              </h3>
              <p className="text-black leading-relaxed">
                Before orbitals hybridize to form chemical bonds, electrons occupy pure 3D probability clouds defined by quantum numbers:
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Orbital Types:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>s Orbital (1 Orbital, Max 2 e⁻):</strong> Spherical &amp; Non-Directional. Electron density is spherically symmetric with 0 angular nodes. Holds maximum 2 electrons with anti-parallel spins.
                </li>
                <li>
                  <strong>p Orbitals (3 Orbitals, Max 6 e⁻):</strong> Dumbbell Lobes (pₓ, pᵧ, p𝓏). Three degenerate perpendicular dumbbell lobes aligned along Cartesian axes (x, y, z). Separated by 90° with a central nodal plane at the nucleus.
                </li>
                <li>
                  <strong>d Orbitals (5 Orbitals, Max 10 e⁻):</strong> Cloverleaf &amp; Torus (dxy, dyz, dxz, dx²-y², dz²). Five degenerate complex orientations. Enables expanded octets in period 3+ elements (sp³d, sp³d²).
                </li>
              </ul>
            </div>

            {/* Section 3: Master Hybridization Table */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                3. Master Hybridization &amp; 3D Geometry Comparison Table
              </h3>
              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs border border-neutral-300 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 text-black font-bold border-b border-neutral-300 text-[11px]">
                    <tr>
                      <th className="p-2.5">Hybrid</th>
                      <th className="p-2.5">Orbitals Mixed</th>
                      <th className="p-2.5">Hybrid Lobes</th>
                      <th className="p-2.5">3D Geometry</th>
                      <th className="p-2.5">Bond Angles</th>
                      <th className="p-2.5">Unhybridized</th>
                      <th className="p-2.5">Real Molecules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-black">
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">s</td>
                      <td className="p-2.5 font-mono">1s (Pure)</td>
                      <td className="p-2.5 font-bold">1</td>
                      <td className="p-2.5 font-bold">Spherical Cloud</td>
                      <td className="p-2.5 font-mono">Non-directional</td>
                      <td className="p-2.5 font-mono">None</td>
                      <td className="p-2.5 font-mono">H, He, 1s atomic</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">sp</td>
                      <td className="p-2.5 font-mono">1s + 1p</td>
                      <td className="p-2.5 font-bold">2</td>
                      <td className="p-2.5 font-bold">Linear</td>
                      <td className="p-2.5 font-mono font-bold">180°</td>
                      <td className="p-2.5 font-mono">2 p (forms 2 π)</td>
                      <td className="p-2.5 font-mono">BeCl₂, CO₂, C₂H₂</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">sp²</td>
                      <td className="p-2.5 font-mono">1s + 2p</td>
                      <td className="p-2.5 font-bold">3</td>
                      <td className="p-2.5 font-bold">Trigonal Planar</td>
                      <td className="p-2.5 font-mono font-bold">120°</td>
                      <td className="p-2.5 font-mono">1 p (forms 1 π)</td>
                      <td className="p-2.5 font-mono">BF₃, SO₃, C₂H₄</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">sp³</td>
                      <td className="p-2.5 font-mono">1s + 3p</td>
                      <td className="p-2.5 font-bold">4</td>
                      <td className="p-2.5 font-bold">Tetrahedral</td>
                      <td className="p-2.5 font-mono font-bold">109.5°</td>
                      <td className="p-2.5 font-mono">0 unhybridized</td>
                      <td className="p-2.5 font-mono">CH₄, CCl₄, NH₄⁺</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">sp³d</td>
                      <td className="p-2.5 font-mono">1s + 3p + 1d</td>
                      <td className="p-2.5 font-bold">5</td>
                      <td className="p-2.5 font-bold">Trigonal Bipyramidal</td>
                      <td className="p-2.5 font-mono font-bold">90° (axial) &amp; 120° (eq)</td>
                      <td className="p-2.5 font-mono">Axial / Eq sites</td>
                      <td className="p-2.5 font-mono">PCl₅, PF₅, SF₄</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">sp³d²</td>
                      <td className="p-2.5 font-mono">1s + 3p + 2d</td>
                      <td className="p-2.5 font-bold">6</td>
                      <td className="p-2.5 font-bold">Octahedral</td>
                      <td className="p-2.5 font-mono font-bold">90° (all 12 angles)</td>
                      <td className="p-2.5 font-mono">Fully orthogonal</td>
                      <td className="p-2.5 font-mono">SF₆, [PCl₆]⁻, XeF₄</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Detailed Breakdown of Each Hybridization */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                4. Visual Breakdown &amp; Stereochemistry of Each State
              </h3>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>sp Hybridization (180° Linear):</strong> 50% s, 50% p character. Two equivalent lobes point in collinear opposite directions. Leaves 2 perpendicular p-orbitals to form double or triple π bonds. Example: <strong>BeCl₂</strong> (Cl—Be—Cl).
                </li>
                <li>
                  <strong>sp² Hybridization (120° Trigonal Planar):</strong> 33.3% s, 66.7% p character. Three equivalent lobes lie coplanar in the XY plane separated by 120°. Leaves 1 perpendicular p_z orbital available for 1 π bond. Example: <strong>BF₃, C₂H₄</strong>.
                </li>
                <li>
                  <strong>sp³ Hybridization (109.5° Tetrahedral):</strong> 25% s, 75% p character. Four equivalent lobes extend symmetrically toward the four vertices of a regular 3D tetrahedron. All 4 valence orbitals form σ bonds or lone pairs. Example: <strong>CH₄, CCl₄</strong>.
                </li>
                <li>
                  <strong>sp³d Hybridization (90° &amp; 120° Trigonal Bipyramidal):</strong> 5 hybrid lobes split into two non-equivalent sets: 3 equatorial lobes separated by 120° in the horizontal plane, and 2 axial lobes oriented vertically at 90°. Example: <strong>PCl₅, SF₄</strong>.
                </li>
                <li>
                  <strong>sp³d² Hybridization (90° Octahedral):</strong> 6 equivalent hybrid lobes pointing along the Cartesian coordinate axes (+x, -x, +y, -y, +z, -z). Highly symmetrical with exactly 12 identical 90° angles and 3 collinear 180° axes. Example: <strong>SF₆, [PCl₆]⁻</strong>.
                </li>
              </ul>
            </div>

            {/* Section 5: Step-by-Step Workshop Guide */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                5. How to Complete the Level 1 Hybridization Challenge
              </h3>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Step 1 (Select 1 s):</strong> Click or drag the <strong>s orbital</strong> from the bottom tray to establish the central base.
                </li>
                <li>
                  <strong>Step 2 (Add p Orbitals):</strong> Add <strong>pₓ, pᵧ, p𝓏</strong> sequentially to unlock <strong>sp (180°)</strong>, <strong>sp² (120°)</strong>, and <strong>sp³ (109.5°)</strong>.
                </li>
                <li>
                  <strong>Step 3 (Add d Orbitals):</strong> Add 2 <strong>d orbitals</strong> to form expanded octet geometries: <strong>sp³d</strong> and <strong>sp³d²</strong>.
                </li>
                <li>
                  <strong>Step 4 (Rotate in 3D):</strong> Drag to rotate the molecule, inspect axial vs equatorial lobe positions, and observe 3D bond angles!
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-neutral-300 bg-white shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full max-w-sm py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
