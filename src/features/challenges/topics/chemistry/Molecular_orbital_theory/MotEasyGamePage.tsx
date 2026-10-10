"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Cylinder, Torus, Sparkles as DreiSparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  ChevronLeft,
  Atom,
  RotateCcw,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  BookOpen,
  MoveHorizontal,
  MousePointerClick,
  Eye,
  Maximize2,
  Play,
  Pause,
  Target
} from 'lucide-react';

import {
  getNucleusMaterial,
  getAO1sMaterial,
  getBondingMOMaterial,
  getAntibondingMOMaterial,
  getNodalPlaneMaterial
} from './materials';

import {
  MOT_EASY_STEPS,
  KEY_CONCEPTS_DATA
} from './helpers';

// ── 3D Nucleus Component ───────────────────────────────────────────────────
const Nucleus3D = ({ position, label }: { position: [number, number, number]; label?: string }) => {
  const mat = useMemo(() => getNucleusMaterial(), []);
  return (
    <group position={position} renderOrder={3}>
      <Sphere args={[0.18, 24, 24]} material={mat} />
      {label && (
        <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
          <div className="text-[11px] font-mono font-bold text-cyan-200 pointer-events-none drop-shadow">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
};

// ── 1s Atomic Orbital 3D Component ──────────────────────────────────────────
const AO1sSphere = ({
  position,
  phase = '+',
  opacity = 0.55
}: {
  position: [number, number, number];
  phase?: '+' | '-';
  opacity?: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => getAO1sMaterial(phase, opacity), [phase, opacity]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} renderOrder={2}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shadow-md border ${phase === '+'
              ? 'bg-blue-600/90 border-blue-300 text-white'
              : 'bg-red-600/90 border-red-300 text-white'
            }`}
        >
          {phase}
        </div>
      </Html>
    </group>
  );
};

// ── Bonding MO (σ1s) 3D Component ───────────────────────────────────────────
const BondingMO1s = ({ opacity = 0.65 }: { opacity?: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const mat = useMemo(() => getBondingMOMaterial(opacity), [opacity]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
        <cylinderGeometry args={[0.85, 0.85, 1.6, 32, 32]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[-0.8, 0, 0]} renderOrder={2}>
        <sphereGeometry args={[0.85, 32, 32, 0, Math.PI * 2, 0, Math.PI]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[0.8, 0, 0]} renderOrder={2}>
        <sphereGeometry args={[0.85, 32, 32, 0, Math.PI * 2, 0, Math.PI]} />
        <primitive object={mat} attach="material" />
      </mesh>

      <Nucleus3D position={[-0.7, 0, 0]} label="H" />
      <Nucleus3D position={[0.7, 0, 0]} label="H" />

      <Html position={[0, 1.4, 0]} center zIndexRange={[100, 0]}>
        <div className="bg-white/95 border border-cyan-300 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-cyan-900 shadow-md flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>High Electron Density Between Nuclei (σ₁⛁)</span>
        </div>
      </Html>
    </group>
  );
};

// ── Antibonding MO (σ*1s) 3D Component ──────────────────────────────────────
const AntibondingMO1s = ({
  showNodeHighlight = true,
  opacity = 0.65
}: {
  showNodeHighlight?: boolean;
  opacity?: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const posMat = useMemo(() => getAntibondingMOMaterial('+', opacity), [opacity]);
  const negMat = useMemo(() => getAntibondingMOMaterial('-', opacity), [opacity]);
  const nodeMat = useMemo(() => getNodalPlaneMaterial(), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[-1.0, 0, 0]}>
        <mesh scale={[1.0, 1.2, 1.2]} renderOrder={2}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <primitive object={posMat} attach="material" />
        </mesh>
        <Nucleus3D position={[0.15, 0, 0]} label="H" />
      </group>

      <group position={[1.0, 0, 0]}>
        <mesh scale={[1.0, 1.2, 1.2]} renderOrder={2}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <primitive object={negMat} attach="material" />
        </mesh>
        <Nucleus3D position={[-0.15, 0, 0]} label="H" />
      </group>

      {/* Nodal Plane */}
      <group position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh renderOrder={3}>
          <circleGeometry args={[1.2, 32]} />
          <primitive object={nodeMat} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
          <torusGeometry args={[1.2, 0.02, 16, 64]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      </group>

      {showNodeHighlight && (
        <Html position={[0, 1.4, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-white/95 border border-rose-300 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-rose-900 shadow-md flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Zero Electron Density at Nodal Plane (σ*₁⛁)</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ── Main MOT Easy Game Page Component ────────────────────────────────────────
export default function MotEasyGamePage({ difficulty = 'easy' }: { difficulty?: string }) {
  const router = useRouter();

  // Screen View Mode
  const [gameStarted, setGameStarted] = useState(false);

  // Challenge States
  const [currentStep, setCurrentStep] = useState(1);
  const [score, setScore] = useState(0);
  const [orbitalDistance, setOrbitalDistance] = useState(3.4);
  const [isCombining, setIsCombining] = useState(false);

  // Placed Orbital Count: 0 = none, 1 = first orbital placed, 2 = both orbitals placed
  const [placedOrbitalCount, setPlacedOrbitalCount] = useState<number>(0);

  const [targetCompleted, setTargetCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHud, setShowHud] = useState(true);

  // Selection choices
  const [selectedOrbital, setSelectedOrbital] = useState<'1s' | 'px' | 'py' | 'pz'>('1s');
  const [phaseMode, setPhaseMode] = useState<'+/+' | '+/-'>('+/+');

  // Key Concepts Modal Drawer
  const [showConceptsModal, setShowConceptsModal] = useState(false);

  // Step information
  const stepInfo = MOT_EASY_STEPS.find((s) => s.id === currentStep) || MOT_EASY_STEPS[0];

  // Orbital selection / drag-drop placement (requires 2 clicks/drops)
  const handleSelectOrbital = (orbId: '1s' | 'px' | 'py' | 'pz') => {
    setSelectedOrbital(orbId);
    setPlacedOrbitalCount((prev) => Math.min(prev + 1, 2));
  };

  // Bring Orbitals Together Action (requires placedOrbitalCount === 2)
  const handleBringTogether = () => {
    if (placedOrbitalCount < 2) return;
    setIsCombining(true);
    let dist = 3.4;
    const interval = setInterval(() => {
      dist -= 0.1;
      if (dist <= 1.5) {
        dist = 1.5;
        clearInterval(interval);
        setIsCombining(false);
        setTargetCompleted(true);
        if (currentStep === 1) {
          setCurrentStep(2);
          setScore((prev) => Math.max(prev, 100));
        }
      }
      setOrbitalDistance(dist);
    }, 35);
  };

  // Reset Distance when navigating step 1
  useEffect(() => {
    if (currentStep === 1) {
      setOrbitalDistance(3.4);
    }
  }, [currentStep]);

  const handleReset = () => {
    setCurrentStep(1);
    setOrbitalDistance(3.4);
    setPlacedOrbitalCount(0);
    setIsCombining(false);
    setTargetCompleted(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col">

      {/* ── 3D CANVAS BACKGROUND (Design System #F8FAFC) ───────────────────── */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const orb = e.dataTransfer.getData('orbital');
          if (orb) {
            handleSelectOrbital(orb as any);
          }
        }}
        className="absolute inset-0 z-0 bg-[#F8FAFC]"
      >
        <Canvas camera={{ position: [0, 4.8, 9.2], fov: 38 }}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <pointLight position={[-5, -4, -5]} intensity={0.5} />

          {/* Background Ambient Sparkles */}
          <DreiSparkles count={45} scale={18} size={2.2} speed={0.4} opacity={0.5} color="#38A9E8" />

          {/* SINGLE STAGE GROUP: Ground Pedestal + Orbitals locked together */}
          <group position={[0, 0, 0]}>

            {/* 1. PEDESTAL BASE RING PLATFORM (Z-Fighting Fixed with World Y Offset & PolygonOffset) */}
            <group position={[0, -1.65, 0]}>
              {/* Main Plate (#F1F5F9) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
                <circleGeometry args={[3.6, 128]} />
                <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.1} />
              </mesh>
              {/* Inner Plate (#E5EEF5) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} renderOrder={1}>
                <circleGeometry args={[2.2, 128]} />
                <meshStandardMaterial
                  color="#E5EEF5"
                  roughness={0.35}
                  metalness={0.05}
                  polygonOffset={true}
                  polygonOffsetFactor={-1}
                />
              </mesh>
              {/* Plate Border Outer Ring (#38A9E8) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} renderOrder={2}>
                <ringGeometry args={[3.53, 3.67, 128]} />
                <meshBasicMaterial
                  color="#38A9E8"
                  transparent
                  opacity={0.95}
                  polygonOffset={true}
                  polygonOffsetFactor={-2}
                />
              </mesh>
              {/* Inner Ring Border (#38A9E8) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} renderOrder={3}>
                <ringGeometry args={[2.17, 2.23, 128]} />
                <meshBasicMaterial
                  color="#38A9E8"
                  transparent
                  opacity={0.8}
                  polygonOffset={true}
                  polygonOffsetFactor={-3}
                />
              </mesh>
            </group>

            {/* 2. DYNAMIC ORBITAL STEP SCENE */}
            {currentStep === 1 && (
              <group position={[0, 0.2, 0]}>
                {/* Slot A (Left Orbital) */}
                <group position={[-orbitalDistance / 2, 0, 0]}>
                  {placedOrbitalCount >= 1 ? (
                    <>
                      <AO1sSphere position={[0, 0, 0]} phase="+" />
                      <Nucleus3D position={[0, 0, 0]} />
                      <Html position={[0, 1.25, 0]} center zIndexRange={[100, 0]}>
                        <span className="text-xs font-bold text-slate-800 tracking-wider drop-shadow-sm bg-white/80 px-2 py-0.5 rounded">
                          H(A)
                        </span>
                      </Html>
                      <Html position={[0, -1.0, 0]} center zIndexRange={[100, 0]}>
                        <span className="text-xs font-bold text-sky-700 tracking-wider font-mono bg-white/80 px-2 py-0.5 rounded">
                          1s
                        </span>
                      </Html>
                    </>
                  ) : (
                    <group>
                      <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.85, 0.02, 16, 64]} />
                        <meshBasicMaterial color="#0284c7" transparent opacity={0.7} />
                      </mesh>
                      <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
                        <span className="text-[10px] font-mono text-sky-800 bg-white/90 px-2 py-1 rounded border border-sky-300 whitespace-nowrap animate-pulse shadow">
                          Drop 1s Slot A (1/2)
                        </span>
                      </Html>
                    </group>
                  )}
                </group>

                {/* Slot B (Right Orbital) */}
                <group position={[orbitalDistance / 2, 0, 0]}>
                  {placedOrbitalCount >= 2 ? (
                    <>
                      <AO1sSphere position={[0, 0, 0]} phase={phaseMode === '+/+' ? '+' : '-'} />
                      <Nucleus3D position={[0, 0, 0]} />
                      <Html position={[0, 1.25, 0]} center zIndexRange={[100, 0]}>
                        <span className="text-xs font-bold text-slate-800 tracking-wider drop-shadow-sm bg-white/80 px-2 py-0.5 rounded">
                          H(B)
                        </span>
                      </Html>
                      <Html position={[0, -1.0, 0]} center zIndexRange={[100, 0]}>
                        <span className="text-xs font-bold text-sky-700 tracking-wider font-mono bg-white/80 px-2 py-0.5 rounded">
                          1s
                        </span>
                      </Html>
                    </>
                  ) : (
                    <group>
                      <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.85, 0.02, 16, 64]} />
                        <meshBasicMaterial color="#0284c7" transparent opacity={0.7} />
                      </mesh>
                      <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
                        <span className="text-[10px] font-mono text-sky-800 bg-white/90 px-2 py-1 rounded border border-sky-300 whitespace-nowrap animate-pulse shadow">
                          {placedOrbitalCount === 1 ? 'Drop 1s Slot B (2/2)' : 'Drop 1s Slot B'}
                        </span>
                      </Html>
                    </group>
                  )}
                </group>

                {/* Floating Distance Badge overlay */}
                {placedOrbitalCount === 2 && (
                  <Html position={[0, 0.4, 0]} center zIndexRange={[100, 0]}>
                    <div className="bg-[#EF4444] text-white font-mono text-xs font-bold px-3 py-1 rounded-lg shadow-lg border border-red-300 flex items-center gap-1.5 animate-pulse">
                      <span>d = {orbitalDistance.toFixed(1)} Å</span>
                    </div>
                  </Html>
                )}
              </group>
            )}

            {/* STEP 2: Render Bonding and Antibonding MOs */}
            {currentStep === 2 && (
              <group position={[0, 0.2, 0]}>
                <group position={[-2.2, 0, 0]} scale={[0.75, 0.75, 0.75]}>
                  <BondingMO1s opacity={0.75} />
                  <Html position={[0, -1.6, 0]} center zIndexRange={[100, 0]}>
                    <span className="text-xs font-bold text-[#1E293B] bg-white border border-[#38A9E8] px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                      Bonding MO (σ₁⛁)
                    </span>
                  </Html>
                </group>

                <group position={[2.2, 0, 0]} scale={[0.75, 0.75, 0.75]}>
                  <AntibondingMO1s showNodeHighlight={true} opacity={0.75} />
                  <Html position={[0, -1.6, 0]} center zIndexRange={[100, 0]}>
                    <span className="text-xs font-bold text-[#1E293B] bg-white border border-[#EF4444] px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                      Antibonding MO (σ*₁⛁)
                    </span>
                  </Html>
                </group>
              </group>
            )}

            {currentStep === 3 && (
              <group position={[0, 0.2, 0]}>
                <BondingMO1s />
              </group>
            )}

            {currentStep === 4 && (
              <group position={[0, 0.2, 0]}>
                <AntibondingMO1s showNodeHighlight={true} />
              </group>
            )}
          </group>

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={5.0}
            maxDistance={12.0}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minPolarAngle={0.1}
            target={[0, -0.2, 0]}
          />
        </Canvas>
      </div>

      {/* ── SCREEN 1: INTRO MISSION TARGET OVERLAY VIEW ────────────────────────── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-6 bg-white/40 backdrop-blur-sm overflow-y-auto">
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
              MOLECULAR ORBITAL THEORY
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              <span className="text-[#2563EB]">TARGET:</span> Combine 1s atomic orbitals to form bonding & antibonding molecular orbitals
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

      {/* ── SCREEN 2: ACTIVE SINGLE CANVAS SIMULATION VIEW ─────────────────────── */}
      {gameStarted && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4">

          {/* ── 1. TOP FLOATING NAVIGATION BAR ─────────────────────────────────── */}
          <div className="w-full flex items-center justify-between pointer-events-auto z-30">
            {/* Top Left: Back Button & Scene Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-[#1E293B] font-extrabold text-xs transition-all shadow-md backdrop-blur-md cursor-pointer"
                title="Back to Topics"
              >
                <ChevronLeft className="w-5 h-5 text-[#2563EB]" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <button
                onClick={() => setShowHud(!showHud)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-md backdrop-blur-md cursor-pointer ${showHud
                    ? 'bg-[#E5EEF5] border-[#22B8CF] text-[#2563EB]'
                    : 'bg-white border-slate-200 text-[#64748B]'
                  }`}
                title="Toggle HUD / Overlay"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-md backdrop-blur-md cursor-pointer"
                title="Reset Challenge"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-md backdrop-blur-md cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Top Center Challenge Title / TARGET COMPLETED Badge */}
            {targetCompleted ? (
              <div className="bg-[#22C55E]/10 border border-[#22C55E]/40 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm text-xs font-extrabold text-[#22C55E] flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <span>TARGET COMPLETED</span>
              </div>
            ) : (
              <div className="bg-white/90 border border-slate-200 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm text-xs font-extrabold text-[#2563EB] font-mono tracking-wider">
                Easy Challenge
              </div>
            )}

            {/* Top Right: Explanation Button & Score */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowConceptsModal(true)}
                className="h-10 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-2 text-purple-700 text-xs font-bold transition-all shadow-md backdrop-blur-md cursor-pointer"
                title="View Explanation & Key Concepts"
              >
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Explanation</span>
              </button>

              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-amber-800 font-extrabold text-xs shadow-sm backdrop-blur-md">
                <span>⭐</span>
                <span>{score}</span>
              </div>
            </div>
          </div>

          {/* ── 2. LEFT FLOATING DRAG & DROP PALETTE ────────────────────────────── */}
          {showHud && (
            <div className="absolute top-16 left-4 z-20 w-48 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl backdrop-blur-xl pointer-events-auto space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1E293B]">
                  <MousePointerClick className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Orbitals Tray</span>
                </div>
                <span className="text-[10px] text-[#2563EB] font-mono font-bold bg-[#E5EEF5] px-1.5 py-0.5 rounded border border-blue-200">
                  {placedOrbitalCount}/2 Placed
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { id: '1s', label: '1s Orbital', desc: 'Click / Drag x2' },
                  { id: 'px', label: 'Phase (+/+)', desc: 'Bonding Mode' },
                  { id: 'py', label: 'Phase (+/-)', desc: 'Antibonding Mode' }
                ].map((orb) => (
                  <div
                    key={orb.id}
                    draggable="true"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('orbital', orb.id);
                    }}
                    onClick={() => {
                      if (orb.id === 'py') setPhaseMode('+/-');
                      else if (orb.id === 'px') setPhaseMode('+/+');
                      handleSelectOrbital('1s');
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing flex items-center justify-between ${placedOrbitalCount > 0 && ((orb.id === 'py' && phaseMode === '+/-') || (orb.id !== 'py' && phaseMode === '+/+'))
                        ? 'bg-[#E5EEF5] border-[#22B8CF] text-[#1E293B] shadow-md ring-1 ring-[#22B8CF]'
                        : 'bg-slate-50/80 border-slate-200 text-[#64748B] hover:border-slate-300 hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#2196F3] shadow-sm flex items-center justify-center text-[10px] font-bold text-white">
                        1s
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1E293B]">{orb.label}</div>
                        <div className="text-[10px] text-[#64748B]">{orb.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* ── 4. FLOATING BOTTOM CONTROL DOCK & SHIFTED TARGET DOCK ──────────────── */}
          <div className="w-full flex flex-col items-center gap-2 pointer-events-auto z-30">
            {/* Shifted Target Drag & Drop Instruction Pill (Bottom Line) */}
            {!targetCompleted && (
              <div className="flex items-center gap-2 bg-white/95 border border-[#38A9E8]/40 px-4 py-1.5 rounded-full text-[#1E293B] text-xs font-extrabold shadow-lg backdrop-blur-md">
                <Target className="w-4 h-4 text-[#2563EB]" />
                <span>
                  {placedOrbitalCount === 0
                    ? 'TARGET: Drag or Click 2 1s Orbitals into Slots'
                    : placedOrbitalCount === 1
                      ? 'TARGET: Drag or Click 2nd 1s Orbital into Slot B'
                      : 'TARGET: Click "Bring Orbitals Together" to Combine'}
                </span>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-xl flex items-center gap-3 max-w-2xl w-full justify-between">

              {/* Pause / Play Toggle */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-1.5 transition-all shadow-sm"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-[#22C55E]" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
                <span className="hidden sm:inline">{isPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>

              {/* Phase Swap Button */}
              <button
                onClick={() => setPhaseMode(phaseMode === '+/+' ? '+/-' : '+/+')}
                className="px-3 py-1.5 bg-[#E5EEF5] hover:bg-blue-100 border border-[#38A9E8] rounded-xl text-xs font-bold text-[#2563EB] flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Phase: {phaseMode}</span>
              </button>

              {/* Main Action Button (Requires placedOrbitalCount === 2) */}
              <button
                onClick={handleBringTogether}
                disabled={placedOrbitalCount < 2 || isCombining}
                className={`px-5 py-2 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 uppercase tracking-wider ${placedOrbitalCount === 2 && !isCombining
                    ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white cursor-pointer transform hover:scale-105'
                    : 'bg-slate-200 text-[#64748B] border border-slate-300 cursor-not-allowed opacity-75'
                  }`}
              >
                <MoveHorizontal className="w-4 h-4" />
                <span>
                  {placedOrbitalCount === 0
                    ? 'Place 1st 1s Orbital (0/2)'
                    : placedOrbitalCount === 1
                      ? 'Place 2nd 1s Orbital (1/2)'
                      : isCombining
                        ? 'Combining...'
                        : 'Bring Orbitals Together'}
                </span>
              </button>

              {/* Step Navigation Buttons */}
              <div className="flex items-center gap-1">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-[#1E293B] transition-all"
                  >
                    ‹ Prev
                  </button>
                )}
                {currentStep < MOT_EASY_STEPS.length ? (
                  <button
                    onClick={() => setCurrentStep((prev) => Math.min(prev + 1, MOT_EASY_STEPS.length))}
                    className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-[#22C55E] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restart</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPLANATION & THEORY MODAL DRAWER ────────────────────────────────── */}
      {showConceptsModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-6">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full flex flex-col max-h-[calc(100vh-7rem)] shadow-2xl overflow-hidden relative text-[#1E293B]">

            {/* Sticky Top Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B]">Molecular Orbital Theory — Beginner's Guide</h3>
                  <p className="text-xs text-[#64748B]">Understanding how 1s atomic orbitals combine to form chemical bonds</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowConceptsModal(false)}
                className="p-2 rounded-full bg-slate-100 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200 transition-all cursor-pointer shrink-0 ml-2"
                title="Close Explanation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 space-y-5 text-xs text-[#1E293B] leading-relaxed overflow-y-auto flex-1">

              {/* Intro Section */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                  <span>⚛️</span> What is Molecular Orbital Theory (MOT)?
                </h4>
                <p className="text-[#1E293B]">
                  In basic chemistry, we often imagine electrons orbiting individual isolated atoms. However, when two atoms come close together to form a molecule, their atomic orbitals overlap and merge into completely new energy states called <strong>Molecular Orbitals (MOs)</strong>. Unlike atomic orbitals, molecular orbitals cover the entire molecule and govern its chemical stability and bonding.
                </p>
              </div>

              {/* 1s + 1s Combination */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-sm">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                  <span>🔄</span> Combining 1s Atomic Orbitals (1s + 1s)
                </h4>
                <p className="text-[#64748B]">
                  In this challenge, we take two Hydrogen (H) atoms, each bringing one spherical <strong>1s atomic orbital</strong>. Electrons behave like 3D quantum waves. When these two 1s wave functions overlap along the internuclear axis, they interact in two different ways depending on their phase: <strong>In-Phase Combination (+ / +)</strong> or <strong>Out-of-Phase Combination (+ / -)</strong>.
                </p>
              </div>

              {/* Bonding MO */}
              <div className="p-4 bg-[#E5EEF5]/50 border border-[#38A9E8]/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                    <span>✨</span> Bonding Molecular Orbital (σ₁⛁)
                  </h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-100 text-[#2563EB] rounded-full border border-blue-200">
                    Same Phase (+/+)
                  </span>
                </div>
                <p className="text-[#1E293B]">
                  When the two 1s orbitals combine with the <strong>same phase (+ / +)</strong>, constructive wave interference occurs. This builds up a high concentration of negative electron density directly between the two positive atomic nuclei. This central electron cloud acts like electrostatic glue, pulling both nuclei together, lowering potential energy, and creating a stable <strong>Bonding MO (σ₁⛁)</strong>.
                </p>
              </div>

              {/* Antibonding MO */}
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#EF4444] flex items-center gap-2">
                    <span>🚫</span> Antibonding Molecular Orbital (σ*₁⛁)
                  </h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 bg-rose-100 text-[#EF4444] rounded-full border border-rose-200">
                    Opposite Phase (+/-)
                  </span>
                </div>
                <p className="text-[#1E293B]">
                  When the two 1s orbitals combine with <strong>opposite phases (+ / -)</strong>, destructive wave interference occurs. The wave amplitudes cancel each other out in the center, creating a <strong>Nodal Plane</strong> halfway between the nuclei where electron probability drops to absolute zero. With no electron density to shield the positive nuclei, they strongly repel each other. This <strong>Antibonding MO (σ*₁⛁)</strong> has higher energy and destabilizes the molecule.
                </p>
              </div>

              {/* Energy Summary Callout */}
              <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-extrabold text-[#22C55E] uppercase tracking-wider">
                  💡 Golden Rule of Orbital Conservation
                </h4>
                <p className="text-[#1E293B] text-xs font-medium">
                  <strong>Number of Atomic Orbitals Combined = Number of Molecular Orbitals Formed.</strong> Combining 2 atomic 1s orbitals always yields exactly 2 molecular orbitals: 1 lower-energy Bonding MO (σ₁⛁) and 1 higher-energy Antibonding MO (σ*₁⛁).
                </p>
              </div>

            </div>

            {/* Sticky Bottom Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setShowConceptsModal(false)}
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Close Explanation & Resume Workshop
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
