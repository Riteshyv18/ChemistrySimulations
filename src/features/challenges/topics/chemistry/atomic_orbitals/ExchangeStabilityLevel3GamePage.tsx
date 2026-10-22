'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Trophy,
  X,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';
import { CoordinateAxes3D } from './Orbitals3D';

// Phase Colors matching standard physical chemistry conventions (matching Image 3 & 4)
const PHASE_RED = '#EF4444'; // Positive (+) lobe
const PHASE_BLUE = '#2563EB'; // Negative (-) lobe / Torus

// ── TYPES & STAGE DEFINITION ────────────────────────────────────────────────
export interface ElementStage {
  id: 'Cr' | 'Cu';
  atomicNumber: number;
  symbol: string;
  name: string;
  aufbauConfig: string;
  groundConfig: string;
  valenceS: { total: number; default: number }; // 4s default count (2)
  valenceD: { total: number; default: number }; // 3d default count (4 for Cr, 9 for Cu)
  targetDCount: number; // 5 for Cr, 10 for Cu
  aufbauK: number; // 6 for Cr, 16 for Cu
  groundK: number; // 10 for Cr, 20 for Cu
  halfOrFullText: string;
  explanation: string;
}

export const ELEMENT_STAGES: ElementStage[] = [
  {
    id: 'Cr',
    atomicNumber: 24,
    symbol: 'Cr',
    name: 'Chromium',
    aufbauConfig: '[Ar] 4s² 3d⁴',
    groundConfig: '[Ar] 4s¹ 3d⁵',
    valenceS: { total: 2, default: 2 },
    valenceD: { total: 5, default: 4 },
    targetDCount: 5,
    aufbauK: 6,
    groundK: 10,
    halfOrFullText: 'Half-Filled 3d⁵ Symmetry',
    explanation:
      'In Chromium (Z=24), transferring one 4s electron into the 3d subshell creates a perfectly half-filled 3d⁵ configuration with 5 parallel spins (m_s = +½). The exchange pairs jump from K = 4×3/2 = 6 to K = 5×4/2 = 10, lowering the atom’s energy and stabilizing the atom.',
  },
  {
    id: 'Cu',
    atomicNumber: 29,
    symbol: 'Cu',
    name: 'Copper',
    aufbauConfig: '[Ar] 4s² 3d⁹',
    groundConfig: '[Ar] 4s¹ 3d¹⁰',
    valenceS: { total: 2, default: 2 },
    valenceD: { total: 10, default: 9 },
    targetDCount: 10,
    aufbauK: 16,
    groundK: 20,
    halfOrFullText: 'Completely Filled 3d¹⁰ Symmetry',
    explanation:
      'In Copper (Z=29), promoting one 4s electron into 3d yields a completely filled 3d¹⁰ subshell. Both spin-up (+½) and spin-down (-½) manifolds achieve maximum exchange energy (10 + 10 = 20 pairs vs 10 + 6 = 16 in 3d⁹), creating complete spherical charge symmetry.',
  },
];

// 5 spatial anchor points for the 5 3d orbital lobes around the nucleus
const ORBITAL_D_POSITIONS: [number, number, number][] = [
  [1.3, 0.65, 0.35],    // d_xy
  [-1.3, 0.65, 0.35],   // d_yz
  [0, -1.4, 0.55],      // d_zx
  [1.05, -0.55, -1.1],  // d_x2-y2
  [-1.05, -0.55, -1.1], // d_z2
];

const ORBITAL_BOX_CONFIG = [
  { id: 'dxy', label: 'dxy', border: 'border-blue-400', bg: 'bg-blue-50/60', text: 'text-blue-700' },
  { id: 'dyz', label: 'dyz', border: 'border-cyan-400', bg: 'bg-cyan-50/60', text: 'text-cyan-700' },
  { id: 'dzx', label: 'dzx', border: 'border-purple-400', bg: 'bg-purple-50/60', text: 'text-purple-700' },
  { id: 'dx2y2', label: 'dx²-y²', border: 'border-amber-400', bg: 'bg-amber-50/60', text: 'text-amber-700' },
  { id: 'dz2', label: 'dz²', border: 'border-rose-400', bg: 'bg-rose-50/60', text: 'text-rose-700' },
];

// ── 3D ATOM & ORBITAL VISUALIZER (Clean White Background Optimized) ───────────

// 3D Nucleus Component
function NucleusMesh({
  symbol,
  atomicNumber,
  isShieldActive,
}: {
  symbol: string;
  atomicNumber: number;
  isShieldActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.04;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer aura glow */}
      <Sphere ref={meshRef} args={[0.48, 32, 32]}>
        <meshStandardMaterial
          color={isShieldActive ? '#F59E0B' : '#0284C7'}
          emissive={isShieldActive ? '#D97706' : '#0369A1'}
          emissiveIntensity={isShieldActive ? 0.6 : 0.25}
          transparent
          opacity={0.5}
        />
      </Sphere>
      {/* Core proton sphere */}
      <Sphere args={[0.34, 32, 32]}>
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.2}
          metalness={0.4}
        />
      </Sphere>
      {/* 2D Label Badge */}
      <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="font-mono font-black text-xs text-white bg-slate-900/90 px-2 py-0.5 rounded-full shadow-md border border-slate-700 select-none flex items-center gap-0.5">
          <span>{symbol}</span>
          <span className="text-[9px] text-sky-400 font-bold">{atomicNumber}</span>
        </div>
      </Html>
    </group>
  );
}

// 4s Translucent Shell (Light sky blue with delicate outline)
function Orbital4sShell({ electronCount }: { electronCount: number }) {
  const shellRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (shellRef.current) {
      shellRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <group>
      <Sphere ref={shellRef} args={[2.35, 36, 36]}>
        <meshStandardMaterial
          color="#38BDF8"
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={electronCount === 2 ? 0.14 : 0.08}
          wireframe={false}
          depthWrite={false}
        />
      </Sphere>
      {/* Subtle equatorial guide ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.33, 2.37, 64]} />
        <meshBasicMaterial color="#0284C7" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// 3D Lobe in Physical Chemistry Phase Red & Blue (Matching Image 4)
function Lobe3DMesh({
  position,
  name,
  isOccupied,
  spinCount,
}: {
  position: [number, number, number];
  name: string;
  isOccupied: boolean;
  spinCount: number;
}) {
  const dir = useMemo(() => new THREE.Vector3(...position).normalize(), [position]);
  const rotation = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return new THREE.Euler().setFromQuaternion(quat);
  }, [dir]);

  return (
    <group position={position} rotation={rotation}>
      {/* Main Dual-Lobe Structure (+ Red, - Blue) */}
      {isOccupied ? (
        <group>
          {/* Upper lobe (Phase Red) */}
          <mesh position={[0, 0.42, 0]} scale={[0.42, 0.54, 0.42]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial
              color={PHASE_RED}
              roughness={0.2}
              metalness={0.15}
            />
          </mesh>
          {/* Lower lobe (Phase Blue) */}
          <mesh position={[0, -0.42, 0]} scale={[0.42, 0.54, 0.42]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial
              color={PHASE_BLUE}
              roughness={0.2}
              metalness={0.15}
            />
          </mesh>
        </group>
      ) : (
        /* Empty target lobe (semi-transparent guide with dashed feel) */
        <mesh scale={[0.38, 0.65, 0.38]}>
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial
            color="#94A3B8"
            transparent
            opacity={0.22}
            wireframe
          />
        </mesh>
      )}

      {/* HTML Subshell Tag */}
      <Html position={[0, -0.65, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          className={`font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow-sm select-none border transition-all ${isOccupied
            ? 'bg-white text-slate-800 border-slate-300 font-extrabold'
            : 'bg-white/80 text-slate-400 border-dashed border-slate-300'
            }`}
        >
          {name}
          {spinCount > 0 && (
            <span className="ml-1 text-blue-600 font-black">
              {spinCount === 1 ? '↑' : '↑↓'}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

// 3D Exchange Energy Laser Arcs (Golden / Amber vectors between parallel spins)
function ExchangeLaserArcs({
  activePositions,
  isMaximized,
}: {
  activePositions: [number, number, number][];
  isMaximized: boolean;
}) {
  const pairs = useMemo(() => {
    const list: [[number, number, number], [number, number, number]][] = [];
    for (let i = 0; i < activePositions.length; i++) {
      for (let j = i + 1; j < activePositions.length; j++) {
        list.push([activePositions[i], activePositions[j]]);
      }
    }
    return list;
  }, [activePositions]);

  const lineColor = isMaximized ? '#D97706' : '#EA580C';

  return (
    <group>
      {pairs.map(([p1, p2], idx) => (
        <Line
          key={`laser-${idx}`}
          points={[p1, p2]}
          color={lineColor}
          lineWidth={isMaximized ? 2.8 : 1.4}
          transparent
          opacity={isMaximized ? 0.9 : 0.55}
        />
      ))}
    </group>
  );
}

// Spherical Gold Stability Forcefield / Shield that expands upon stabilization
function StabilityShieldMesh({ isActive }: { isActive: boolean }) {
  const shieldRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (shieldRef.current) {
      shieldRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      shieldRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      const targetScale = isActive ? 1.0 : 0.001;
      shieldRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }
  });

  return (
    <group>
      <mesh ref={shieldRef} scale={[0.001, 0.001, 0.001]}>
        <sphereGeometry args={[2.7, 40, 40]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#D97706"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={isActive ? 0.28 : 0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── PROPS ───────────────────────────────────────────────────────────────────
export interface ExchangeStabilityLevel3GamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function ExchangeStabilityLevel3GamePage({
  difficulty = 'level3',
  onExit,
}: ExchangeStabilityLevel3GamePageProps) {
  // Screen flow: 'mission' -> 'instructions' -> 'game'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Active Element Stage: 0 = Chromium (Z=24), 1 = Copper (Z=29)
  const [stageIndex, setStageIndex] = useState(0);
  const currentStage = ELEMENT_STAGES[stageIndex];

  // Dynamic Electron State for current stage:
  const [sElectrons, setSElectrons] = useState<number>(2);
  const [dElectrons, setDElectrons] = useState<number>(currentStage.valenceD.default);

  // Drag / Selection interaction state
  const [isElectronSelected, setIsElectronSelected] = useState(false);
  const [shakingBoxIdx, setShakingBoxIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info' | 'highlight' | 'error';
    message: string;
  } | null>(null);

  // Modals & Completion
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Synchronize state when switching element stage
  useEffect(() => {
    setSElectrons(currentStage.valenceS.default);
    setDElectrons(currentStage.valenceD.default);
    setIsElectronSelected(false);
    setShakingBoxIdx(null);
    setFeedback({
      type: 'info',
      message: `Aufbau default: ${currentStage.aufbauConfig}. Drag or tap the 4s electron to transfer it to 3d!`,
    });
  }, [stageIndex, currentStage]);

  // Calculations for Exchange Energy K
  const exchangePairs = useMemo(() => {
    if (currentStage.id === 'Cr') {
      const n = dElectrons;
      return (n * (n - 1)) / 2;
    } else {
      const spinUp = Math.min(dElectrons, 5);
      const spinDown = Math.max(0, dElectrons - 5);
      const kUp = (spinUp * (spinUp - 1)) / 2;
      const kDown = (spinDown * (spinDown - 1)) / 2;
      return kUp + kDown;
    }
  }, [dElectrons, currentStage]);

  // Is Ground State achieved?
  const isStabilized = dElectrons === currentStage.targetDCount && sElectrons === 1;

  // Active 3D Lobe Positions for laser arc visualization
  const activeLobePositions = useMemo(() => {
    const count = Math.min(dElectrons, 5);
    return ORBITAL_D_POSITIONS.slice(0, count);
  }, [dElectrons]);

  // Handle Transfer from 4s -> 3d (Correct)
  const handleTransferToD = () => {
    if (sElectrons <= 1) return;
    setSElectrons(1);
    setDElectrons(currentStage.targetDCount);
    setIsElectronSelected(false);
    setShakingBoxIdx(null);
    setFeedback({
      type: 'success',
      message: `⚡ STABILIZED! ${currentStage.halfOrFullText} achieved! Exchange energy surged to K=${currentStage.groundK} (+4K).`,
    });
  };

  // Handle Dropping or Clicking on ANY of the 5 3d orbital boxes (No hints from start, red shake if incorrect)
  const handleOrbitalSlotInteraction = (targetIdx: number) => {
    if (sElectrons <= 1) return;

    // Correct slot to complete half-filled (Cr) or fully-filled (Cu) symmetry
    const correctTargetIdx = 4;

    if (targetIdx === correctTargetIdx) {
      handleTransferToD();
    } else {
      setShakingBoxIdx(targetIdx);
      setTimeout(() => setShakingBoxIdx(null), 700);

      const errorMessage =
        currentStage.id === 'Cr'
          ? "Hund's Rule: Electrons must occupy vacant degenerate orbitals (parallel spin) before pairing up!"
          : "Pauli Exclusion: This orbital is already fully occupied with 2 electrons! Transfer to the singly-occupied orbital.";

      setFeedback({
        type: 'error',
        message: errorMessage,
      });

      // Auto-clear error banner
      setTimeout(() => {
        setFeedback((prev) => (prev?.type === 'error' ? null : prev));
      }, 2500);
    }
  };

  // Handle Revert back to hypothetical Aufbau
  const handleRevertToAufbau = () => {
    setSElectrons(currentStage.valenceS.default);
    setDElectrons(currentStage.valenceD.default);
    setIsElectronSelected(false);
    setFeedback({
      type: 'info',
      message: `Reverted to Aufbau configuration (${currentStage.aufbauConfig}). Notice the lower exchange energy K=${currentStage.aufbauK}.`,
    });
  };

  // Next Stage or Complete
  const handleNextStage = () => {
    if (stageIndex < ELEMENT_STAGES.length - 1) {
      setStageIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Calculate electron distributions in 5 3d boxes
  const dBoxOccupancy = useMemo(() => {
    const boxes = [0, 0, 0, 0, 0];
    for (let i = 0; i < dElectrons; i++) {
      boxes[i % 5] += 1;
    }
    return boxes;
  }, [dElectrons]);

  return (
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-2 sm:p-2.5 max-w-[440px] mx-auto">
      {/* ── INTRO MISSION & INSTRUCTIONS VIEW OVERLAY (Matching Image 2 & 3) ──── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar: Exit Button Only (Same style as BACK) */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION SCREEN (Clean Minimalist View with Easy-to-Understand Mission Text) */}
          {introStep === 'mission' && (
            <div className="max-w-md mx-auto my-auto text-center space-y-4 sm:space-y-5 z-10 px-4 py-4 animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                <span className="text-[#2563EB]">MISSION:</span> Transfer Electrons to Reach Stability
              </h1>



              <div className="pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIntroStep('instructions')}
                  className="px-8 sm:px-10 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INSTRUCTIONS SCREEN (2 Instructions with Visual Diagram Images) */}
          {introStep === 'instructions' && (
            <div className="max-w-md mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-4 py-1 animate-in fade-in duration-200 w-full flex-1">
              <div className="text-center pt-1 pb-2">
                <h2 className="text-[#1E293B] text-base sm:text-lg font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              <div className="flex flex-col gap-3 w-full mx-auto my-auto">
                {/* 1. Inspect the Aufbau Dilemma */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Inspect the Aufbau Dilemma
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] tracking-wide">
                        Quantum Configuration
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                      Observe the 3D atom and orbital deck. Initially, the atom is set to the hypothetical Aufbau configuration (<span className="font-bold text-slate-800">4s² 3d⁴</span> or <span className="font-bold text-slate-800">4s² 3d⁹</span>) with lower exchange energy.
                    </p>
                  </div>

                  {/* Visual Preview Diagram 1: Initial Aufbau State */}
                  <div className="w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-xs p-2.5 mt-2 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-tight">
                        Initial Aufbau State: 4s² 3d⁴
                      </span>
                      <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        Low Stability (K = 6)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 4s Box */}
                      <div className="flex flex-col items-center">
                        <span className="text-[8.5px] font-mono text-slate-400 font-bold">4s</span>
                        <div className="w-9 h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                          ↑<span className="text-amber-600">↓</span>
                        </div>
                      </div>

                      <span className="text-slate-300 font-mono font-bold text-xs">+</span>

                      {/* 3d Subshell (5 Boxes) */}
                      <div className="flex-1 flex flex-col">
                        <span className="text-[8.5px] font-mono text-slate-400 font-bold text-center">3d Subshell</span>
                        <div className="grid grid-cols-5 gap-1">
                          <div className="h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                            ↑
                          </div>
                          <div className="h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                            ↑
                          </div>
                          <div className="h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                            ↑
                          </div>
                          <div className="h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                            ↑
                          </div>
                          <div className="h-10 rounded-lg bg-amber-50/80 border-2 border-dashed border-amber-400 flex items-center justify-center font-mono font-black text-[10px] text-amber-600">
                            —
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Transfer 4s Electron to 3d Slot */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Transfer 4s Electron to 3d Slot
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] tracking-wide">
                        Tactile Drag &amp; Drop
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                      Drag or click the downward spin electron (<span className="text-amber-600 font-bold">↓</span>) from the 4s orbital and place it into the vacant 3d slot to complete half-filled symmetry!
                    </p>
                  </div>

                  {/* Visual Preview Diagram 2: Transfer Action into 3d */}
                  <div className="w-full rounded-xl overflow-hidden bg-emerald-50/60 border border-emerald-200/90 shadow-xs p-2.5 mt-2 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-tight">
                        Half-Filled State: 4s¹ 3d⁵
                      </span>
                      <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span>Max Exchange (K = 10, +4K)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* 4s Box (1 Electron + Transferred) */}
                      <div className="flex flex-col items-center">
                        <span className="text-[8.5px] font-mono text-slate-400 font-bold">4s¹</span>
                        <div className="w-9 h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                          ↑
                        </div>
                      </div>

                      {/* Transfer Arrow Indicator */}
                      <div className="flex flex-col items-center justify-center text-emerald-600 px-0.5">
                        <span className="text-[7.5px] font-mono font-bold text-amber-600 uppercase">Transfer</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                      </div>

                      {/* 3d Subshell (5 Symmetrical Parallel Spins) */}
                      <div className="flex-1 flex flex-col">
                        <span className="text-[8.5px] font-mono text-emerald-700 font-bold text-center">
                          3d⁵ (Half-Filled Symmetric)
                        </span>
                        <div className="grid grid-cols-5 gap-1">
                          <div className="h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                            ↑
                          </div>
                          <div className="h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                            ↑
                          </div>
                          <div className="h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                            ↑
                          </div>
                          <div className="h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono font-black text-xs text-blue-600 shadow-xs">
                            ↑
                          </div>
                          <div className="h-10 rounded-lg bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center font-mono font-black text-xs text-emerald-700 shadow-xs ring-2 ring-emerald-300/60 animate-pulse">
                            ↑
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back & Play */}
              <div className="pt-3 pb-1 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep('mission')}
                  className="px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameStarted(true)}
                  className="px-8 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN 3: ACTIVE 3D GAMEPLAY SCREEN (Matching Image 4 White Canvas Structure) ── */}
      {gameStarted && (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {/* ── 1. TOP TOOLBAR HEADER: EXIT (SAME AS BACK) & EXPLANATION (SAME AS PLAY) ── */}
          <header className="w-full flex items-center justify-between z-20 gap-2 shrink-0 py-0.5 mb-1 px-0.5">
            {/* Top Left: Exit Button (Same style as BACK) */}
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Top Right: Explanation Button (Same style as PLAY) */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 shrink-0"
              title="View Theory & Explanation"
            >
              <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Explanation</span>
            </button>
          </header>

          {/* Floating Error Feedback Banner (shown when incorrect orbital is clicked/dropped) */}
          {feedback && feedback.type === 'error' && (
            <div className="absolute top-11 left-2 right-2 z-30 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md max-w-[95%] text-center border backdrop-blur-md pointer-events-auto flex items-center gap-1.5 bg-red-500/95 text-white border-red-600 animate-shake shadow-red-500/20">
                <span className="font-black text-red-100">✕</span>
                <span>{feedback.message}</span>
              </div>
            </div>
          )}

          {/* ── 2. UPPER / MAIN AREA: 3D ATOM & ORBITAL CANVAS (BALANCED ZOOM & POSITION) ── */}
          <div className="w-full flex-1 min-h-0 relative overflow-hidden bg-white rounded-2xl border border-slate-100 cursor-grab active:cursor-grabbing">
            <div className="w-full h-full -translate-y-5 sm:-translate-y-6">
              <Canvas
                camera={{ position: [0, 0, 6.8], fov: 40 }}
                className="w-full h-full touch-none"
              >
                {/* Pure White Background */}
                <color attach="background" args={['#FFFFFF']} />
                <ambientLight intensity={1.3} />
                <directionalLight position={[8, 10, 8]} intensity={1.3} />
                <directionalLight position={[-8, -6, -8]} intensity={0.5} />
                <pointLight position={[0, 2, 2]} intensity={isStabilized ? 1.2 : 0.4} color={isStabilized ? '#F59E0B' : '#0284C7'} />

                {/* Scaled 3D Atom Group (Zoomed out slightly to match Image 2 reference with clean margins) */}
                <group scale={0.58} position={[0, 0, 0]}>
                  {/* 3D Coordinate Axes (x, y, z with black arrows, matching Image 4) */}
                  <CoordinateAxes3D hideLabels={false} />

                  {/* 3D Central Nucleus */}
                  <NucleusMesh
                    symbol={currentStage.symbol}
                    atomicNumber={currentStage.atomicNumber}
                    isShieldActive={isStabilized}
                  />

                  {/* Five 3D Lobes in Phase Red & Blue */}
                  {ORBITAL_D_POSITIONS.map((pos, idx) => (
                    <Lobe3DMesh
                      key={`lobe-${idx}`}
                      position={pos}
                      name={ORBITAL_BOX_CONFIG[idx].label}
                      isOccupied={idx < dElectrons}
                      spinCount={dBoxOccupancy[idx]}
                    />
                  ))}

                  {/* 3D Exchange Energy Laser Arcs (Golden/Amber) */}
                  <ExchangeLaserArcs
                    activePositions={activeLobePositions}
                    isMaximized={isStabilized}
                  />

                  {/* Golden Stability Shield */}
                  <StabilityShieldMesh isActive={isStabilized} />
                </group>

                {/* Orbit Controls (Enabled Zoom so user can zoom in/out freely) */}
                <OrbitControls
                  target={[0, 0, 0]}
                  enableZoom={true}
                  minDistance={4.0}
                  maxDistance={16}
                  enablePan={false}
                  minPolarAngle={Math.PI / 10}
                  maxPolarAngle={(9 * Math.PI) / 10}
                />
              </Canvas>
            </div>
          </div>

          {/* ── 3. BOTTOM SECTION: 2-ROW DRAG AND DROP BOXES (LARGER SIZES) ── */}
          <div className="w-full shrink-0 flex flex-col gap-2.5 pt-1.5 pb-2 px-1 bg-white border-t border-slate-100/80">
            {/* ROW 1: 4s Orbital Box (Centered, with draggable 4s electron) */}
            <div className="flex items-center justify-center w-full max-w-[430px] mx-auto px-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-mono font-black text-slate-700 uppercase tracking-tight">
                  4s Orbital:
                </span>
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-50 border-2 border-dashed border-amber-300 shadow-xs">
                  {/* Fixed Slot 1 */}
                  <div
                    className="w-14 h-16 sm:w-16 sm:h-18 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-xs select-none"
                    title="Fixed 4s spin-up electron"
                  >
                    <span className="text-[9px] font-mono font-bold text-slate-400 leading-none">4s₁</span>
                    <span className="font-mono font-black text-blue-600 text-xl sm:text-2xl leading-none my-auto">
                      ↑
                    </span>
                  </div>

                  {/* Removable / Draggable Slot 2 */}
                  {sElectrons === 2 ? (
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        setIsElectronSelected(true);
                        e.dataTransfer.setData('text/plain', '4s2');
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => {
                        setIsElectronSelected(!isElectronSelected);
                      }}
                      className={`w-14 h-16 sm:w-16 sm:h-18 rounded-xl border-2 flex flex-col items-center justify-between py-1.5 font-mono font-black text-base cursor-grab active:cursor-grabbing transition-all transform hover:scale-105 active:scale-95 shadow-xs ${isElectronSelected
                        ? 'bg-amber-100 border-amber-500 text-amber-800 ring-2 ring-amber-400 animate-pulse'
                        : 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100'
                        }`}
                      title="Drag this 4s electron and drop it into a 3d orbital"
                    >
                      <span className="text-[9px] font-mono font-bold text-amber-700 leading-none">4s₂</span>
                      <span className="leading-none text-xl sm:text-2xl font-black text-amber-700 my-auto">↓</span>
                      <span className="text-[8px] font-mono font-black text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded-xs leading-tight">
                        {isElectronSelected ? 'SELECTED' : 'DRAG'}
                      </span>
                    </button>
                  ) : (
                    <div className="w-14 h-16 sm:w-16 sm:h-18 rounded-xl border-2 border-dashed border-slate-300 bg-white/70 flex flex-col items-center justify-center text-[11px] text-slate-400 font-mono font-bold shadow-xs">
                      <span className="text-[9px] text-slate-300">4s₂</span>
                      <span className="my-auto text-xs text-slate-400 font-bold">empty</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: Five 3d Subshell Boxes (Below 4s, Larger Boxes across full width) */}
            <div className="w-full flex flex-col items-center">
              <div className="w-full flex items-center justify-between max-w-[430px] px-1 mb-1.5">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-600 tracking-tight">
                  3d Subshells (Degenerate):
                </span>
                <span className="text-[11px] font-mono font-extrabold text-blue-600">
                  {dElectrons} / 10 e⁻
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 w-full max-w-[430px]">
                {dBoxOccupancy.map((count, idx) => {
                  const cfg = ORBITAL_BOX_CONFIG[idx];
                  const isShaking = shakingBoxIdx === idx;

                  return (
                    <div
                      key={`dbox-${idx}`}
                      onDragOver={(e) => {
                        if (sElectrons > 1) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (sElectrons > 1) handleOrbitalSlotInteraction(idx);
                      }}
                      onClick={() => {
                        if (sElectrons > 1 && isElectronSelected) {
                          handleOrbitalSlotInteraction(idx);
                        }
                      }}
                      className={`h-20 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-between py-2 px-1 transition-all shadow-xs ${
                        isShaking
                          ? 'bg-red-50 border-red-500 ring-2 ring-red-400 text-red-600 animate-shake'
                          : `${cfg.border} border-dashed ${cfg.bg} ${
                              isElectronSelected && sElectrons > 1
                                ? 'cursor-pointer hover:border-slate-500 hover:scale-[1.03] transition-transform'
                                : ''
                            }`
                      }`}
                      title={`3d subshell ${cfg.label} (${idx + 1})`}
                    >
                      <span className="text-[10px] sm:text-[11px] font-mono font-extrabold text-slate-600 uppercase tracking-tight block leading-none">
                        {cfg.label}
                      </span>

                      <div className="font-mono font-black text-lg sm:text-2xl leading-none flex items-center justify-center my-auto">
                        {count === 0 ? (
                          <span className="text-slate-400 text-base font-bold">—</span>
                        ) : count === 1 ? (
                          <span className="text-blue-700">↑</span>
                        ) : (
                          <span className="text-blue-700">
                            ↑<span className="text-emerald-600">↓</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[9.5px] sm:text-[10.5px] font-mono font-black leading-none ${
                          isShaking ? 'text-red-500 font-extrabold' : cfg.text
                        }`}
                      >
                        d{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Advance button when stabilized */}
            {isStabilized && (
              <div className="w-full flex justify-center pt-1 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="py-2 px-6 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>
                    {stageIndex < ELEMENT_STAGES.length - 1 ? 'Next: Copper (Cu²⁹)' : 'Complete Challenge'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONCEPTS & THEORY EXPLANATION FULL SCREEN VIEW (Matching Bohr Model Level 1 Reference) ── */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                Quantum Anomalies &amp; Exchange Stability in Transition Metals
              </h2>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-semibold text-xs transition-all cursor-pointer border border-neutral-300 active:scale-95 shrink-0"
            >
              <X className="w-4 h-4 text-black" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content Body (Pure Black Font, Generous Line Height, Mixed Paragraphs, Formula Cards, Bullet Points) */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-7 sm:space-y-8 text-black text-base sm:text-lg leading-relaxed max-w-3xl mx-auto w-full">
            {/* Section 1: The Origin of Exchange Energy & Quantum Symmetry */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                1. The Origin of Exchange Energy &amp; Quantum Symmetry
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                In multi-electron transition metal atoms, electrons with parallel spins (<span className="font-mono font-bold">m_s = +½</span>) occupying degenerate subshells can exchange their spatial coordinates. Because electrons with identical spins cannot occupy the same quantum state (Pauli exclusion principle), they naturally avoid each other, lowering inter-electronic electrostatic repulsion and releasing quantum stabilization energy known as <strong>Exchange Energy</strong>:
              </p>
              <div className="my-2 p-2.5 bg-neutral-100 border border-neutral-300 rounded-xl font-mono text-center font-bold text-black text-base sm:text-lg">
                Total Exchange Pairs K = n(n - 1) / 2
              </div>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Exchange Integral (K):</strong> For every unique pair of electrons with identical spin orientation in degenerate orbitals, a stabilizing quantum exchange integral is added to the binding energy.
                </li>
                <li>
                  <strong>Degeneracy Requirement:</strong> Exchange stabilization only occurs between electrons within the same degenerate energy level (e.g. among the five 3d orbitals). Electrons cannot exchange between non-degenerate shells like 4s and 3d.
                </li>
                <li>
                  <strong>Why n Matters:</strong> Because the number of pairs scales quadratically with <span className="font-mono font-bold">n(n - 1) / 2</span>, each additional parallel spin produces a disproportionately large surge in stability.
                </li>
              </ul>
            </div>

            {/* Section 2: Why Chromium (Z=24) Adopts [Ar] 4s¹ 3d⁵ */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                2. Chromium (Z = 24): Why Nature Favors [Ar] 4s¹ 3d⁵ over [Ar] 4s² 3d⁴
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                According to the naive Aufbau principle, the 4s orbital fills before 3d, predicting an electron configuration of <span className="font-mono font-bold">[Ar] 4s² 3d⁴</span>. However, experimental spectroscopic measurements prove that the actual ground state is <span className="font-mono font-bold">[Ar] 4s¹ 3d⁵</span>:
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Hypothetical Aufbau [Ar] 4s² 3d⁴:</strong> With 4 parallel spins in the 3d subshell, the total exchange pairs are <span className="font-mono font-bold">K = 4(3) / 2 = 6 pairs</span>.
                </li>
                <li>
                  <strong>Actual Ground State [Ar] 4s¹ 3d⁵:</strong> By promoting one 4s electron into the 5th vacant 3d orbital, all five 3d orbitals contain parallel spins: <span className="font-mono font-bold">K = 5(4) / 2 = 10 pairs</span>.
                </li>
                <li>
                  <strong>Net Stabilization (+4K Gain):</strong> The transition gains 4 additional exchange interactions (<span className="font-bold text-black">+4K</span>). This quantum stabilization substantially exceeds the tiny excitation energy required to promote an electron from 4s to 3d.
                </li>
                <li>
                  <strong>Spherical Charge Symmetry:</strong> In a half-filled 3d⁵ configuration, electron density is distributed uniformly across all spatial axes (xy, yz, zx, x²-y², z²), minimizing mutual screening interference.
                </li>
              </ul>
            </div>

            {/* Section 3: Why Copper (Z=29) Adopts [Ar] 4s¹ 3d¹⁰ */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                3. Copper (Z = 29): Fully-Filled d¹⁰ Subshell Stability
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                A parallel phenomenon occurs in Copper. The predicted Aufbau configuration is <span className="font-mono font-bold">[Ar] 4s² 3d⁹</span>, but Copper spontaneously shifts to <span className="font-mono font-bold">[Ar] 4s¹ 3d¹⁰</span>:
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Hypothetical Aufbau [Ar] 4s² 3d⁹:</strong> Contains 5 spin-up electrons (<span className="font-mono font-bold">K = 10</span>) and 4 spin-down electrons (<span className="font-mono font-bold">K = 6</span>), giving a total of <span className="font-mono font-bold">16 exchange pairs</span>.
                </li>
                <li>
                  <strong>Actual Ground State [Ar] 4s¹ 3d¹⁰:</strong> Transferring one 4s electron completes both spin manifolds: 5 spin-up (<span className="font-mono font-bold">K = 10</span>) + 5 spin-down (<span className="font-mono font-bold">K = 10</span>) = <span className="font-mono font-bold">20 exchange pairs</span> (<span className="font-bold text-black">+4K gain</span>).
                </li>
                <li>
                  <strong>Complete Shell Shielding:</strong> Completely filled subshells possess total spherical charge symmetry (<span className="font-mono font-bold">L = 0</span>), significantly enhancing nuclear shielding for outer valence shells and lowering total atomic energy.
                </li>
              </ul>
            </div>

            {/* Section 4: Physical Factors Governing Electron Promotion */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                4. Physical Factors Balancing Energy Promotion
              </h3>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Proximity of 4s and 3d Energies:</strong> In 3d transition metals, the energy difference between 4s and 3d orbitals (<span className="font-mono font-bold">ΔE_(4s→3d)</span>) is extremely small (~1–2 eV), enabling modest exchange gains to overcome promotional thresholds.
                </li>
                <li>
                  <strong>Relief of Pairing Energy:</strong> In 4s² 3d⁴, two electrons are forced into the small 4s volume, incurring Coulombic pairing repulsion. Moving one electron to the spacious 3d subshell relieves this repulsive penalty.
                </li>
                <li>
                  <strong>Why Other Elements Don&apos;t Shift:</strong> Elements like Vanadium (3d³) or Nickel (3d⁸) require promoting multiple electrons or gain fewer exchange pairs, which is insufficient to offset the promotion energy.
                </li>
              </ul>
            </div>

            {/* Section 5: 3D Simulation Elements & Visual Mechanics */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                5. 3D Simulation Elements &amp; Gameplay Mechanics
              </h3>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Central Nucleus (Cr²⁴ / Cu²⁹):</strong> Represents the positive nuclear charge holding the 4s and 3d electronic manifolds.
                </li>
                <li>
                  <strong>4s Outer Spherical Shell:</strong> Light sky-blue translucent sphere showing the non-directional spherical boundary of the 4s orbital.
                </li>
                <li>
                  <strong>Five 3D d-Orbital Lobes:</strong> Rendered in phase colors (Red for positive phase, Blue for negative phase) along the Cartesian coordinate axes.
                </li>
                <li>
                  <strong>Exchange Laser Arcs:</strong> Glowing amber quantum vectors that illuminate all possible parallel spin exchange pairs. When transferring the 4s electron, new laser arcs appear, surging from K=6 to K=10!
                </li>
                <li>
                  <strong>Golden Stability Forcefield:</strong> Expands outward when maximum symmetry and ground-state exchange energy are unlocked.
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-neutral-300 bg-white shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-full max-w-sm py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: FINAL COMPLETION VICTORY ─────────────────────────────────── */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="max-w-xs w-full bg-white border border-slate-200 rounded-3xl p-5 text-center shadow-2xl space-y-3 text-slate-800">
            <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-300 mx-auto flex items-center justify-center animate-bounce">
              <Trophy className="w-7 h-7 text-amber-600" />
            </div>

            <div className="space-y-0.5">
              <div className="text-[10px] font-mono text-amber-600 font-bold uppercase tracking-widest">
                CHALLENGE MASTERED
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Quantum Stability Shield Unlocked!
              </h2>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Outstanding work! You mastered the physical mechanism behind Aufbau anomalies. Half-filled and completely filled subshells maximize exchange energy (<span className="text-amber-700 font-bold">K</span>) and establish spherical charge symmetry.
            </p>

            <div className="grid grid-cols-2 gap-2 text-left pt-1">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                <div className="text-slate-500 font-mono text-[9.5px]">Chromium</div>
                <div className="font-bold text-amber-600 font-mono">[Ar] 4s¹ 3d⁵</div>
                <div className="text-[9.5px] text-slate-500">10 Exchange Pairs</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                <div className="text-slate-500 font-mono text-[9.5px]">Copper</div>
                <div className="font-bold text-blue-600 font-mono">[Ar] 4s¹ 3d¹⁰</div>
                <div className="text-[9.5px] text-slate-500">20 Exchange Pairs</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStageIndex(0);
                  setIsCompleted(false);
                }}
                className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              >
                PLAY AGAIN
              </button>
              <button
                type="button"
                onClick={() => (onExit ? onExit() : exitSimulation())}
                className="px-5 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer"
              >
                FINISH &amp; EXIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
