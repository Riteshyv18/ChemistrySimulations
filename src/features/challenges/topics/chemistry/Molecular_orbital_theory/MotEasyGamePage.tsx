"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Sparkles as DreiSparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
  MoveHorizontal,
  Play,
  ArrowLeft,
  Layers,
  Info
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

import {
  getNucleusMaterial,
  getAO1sMaterial,
  getBondingMOMaterial,
  getAntibondingMOMaterial,
  getNodalPlaneMaterial
} from './materials';

import {
  MOT_EASY_STEPS
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
          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shadow-md border ${
            phase === '+'
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

      <Html position={[0, 1.45, 0]} center zIndexRange={[100, 0]}>
        <div className="bg-transparent border border-cyan-400/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-cyan-800 flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>High Electron Density Between Nuclei (σ₁s)</span>
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
        <Html position={[0, 1.45, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-transparent border border-rose-400/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-rose-700 flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Zero Electron Density at Nodal Plane (σ*₁s)</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ── Main MOT Easy Game Page Component ────────────────────────────────────────
export default function MotEasyGamePage({
  difficulty = 'level1',
  onExit
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  const router = useRouter();

  // Screen View Mode: 'mission' | 'instructions'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Challenge States
  const [currentStep, setCurrentStep] = useState(1);
  const [orbitalDistance, setOrbitalDistance] = useState(3.4);
  const [isCombining, setIsCombining] = useState(false);

  // Placed Orbital Count: 0 = none, 1 = first orbital placed, 2 = both orbitals placed
  const [placedOrbitalCount, setPlacedOrbitalCount] = useState<number>(0);
  const [targetCompleted, setTargetCompleted] = useState(false);

  // Key Concepts / Explanation Modal (Full Canvas)
  const [showConceptsModal, setShowConceptsModal] = useState(false);

  // Reset Distance when navigating step 1
  useEffect(() => {
    if (currentStep === 1) {
      setOrbitalDistance(3.4);
    }
  }, [currentStep]);

  // Orbital selection / tap placement
  const handleSelectOrbital = (orbId: '1s' = '1s') => {
    setPlacedOrbitalCount((prev) => Math.min(prev + 1, 2));
  };

  // Bring Orbitals Together Action (requires placedOrbitalCount === 2)
  const handleBringTogether = () => {
    if (placedOrbitalCount < 2 || isCombining || targetCompleted) return;
    setIsCombining(true);
    let dist = 3.4;
    const interval = setInterval(() => {
      dist -= 0.1;
      if (dist <= 1.5) {
        dist = 1.5;
        clearInterval(interval);
        setIsCombining(false);
        setTargetCompleted(true);
        setCurrentStep(2); // show both Bonding & Antibonding MOs
      }
      setOrbitalDistance(dist);
    }, 35);
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-1.5 sm:p-2.5 gap-1.5 sm:gap-2">

      {/* ── 3D CANVAS BACKGROUND ────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleSelectOrbital('1s');
        }}
        className="absolute inset-0 z-0 bg-[#F8FAFC]"
      >
        <Canvas camera={{ position: [0, 1.1, 9.8], fov: 36 }}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <pointLight position={[-5, -4, -5]} intensity={0.5} />

          {/* Background Ambient Sparkles */}
          <DreiSparkles count={45} scale={18} size={2.2} speed={0.4} opacity={0.5} color="#38A9E8" />

          {/* SINGLE STAGE GROUP (Plate removed completely from center as requested) */}
          <group position={[0, 0, 0]}>

            {/* DYNAMIC ORBITAL STEP SCENE */}
            {currentStep === 1 && (
              <group position={[0, 0.1, 0]}>
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
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-white/95 px-2.5 py-1 rounded-md border border-slate-300 whitespace-nowrap shadow-sm">
                          Slot A
                        </span>
                      </Html>
                    </group>
                  )}
                </group>

                {/* Slot B (Right Orbital) */}
                <group position={[orbitalDistance / 2, 0, 0]}>
                  {placedOrbitalCount >= 2 ? (
                    <>
                      <AO1sSphere position={[0, 0, 0]} phase="+" />
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
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-white/95 px-2.5 py-1 rounded-md border border-slate-300 whitespace-nowrap shadow-sm">
                          Slot B
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

            {/* STEP 2: Render Bonding and Antibonding MOs simultaneously with larger scale and separation */}
            {currentStep >= 2 && (
              <group position={[0, 0.1, 0]}>
                <group position={[-2.7, 0, 0]} scale={[0.92, 0.92, 0.92]}>
                  <BondingMO1s opacity={0.75} />
                  <Html position={[0, -1.65, 0]} center zIndexRange={[100, 0]}>
                    <span className="text-xs font-bold text-[#1E293B] bg-white/85 border border-[#38A9E8] px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      Bonding MO (σ₁s)
                    </span>
                  </Html>
                </group>

                <group position={[2.7, 0, 0]} scale={[0.92, 0.92, 0.92]}>
                  <AntibondingMO1s showNodeHighlight={true} opacity={0.75} />
                  <Html position={[0, -1.65, 0]} center zIndexRange={[100, 0]}>
                    <span className="text-xs font-bold text-[#1E293B] bg-white/85 border border-[#EF4444] px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      Antibonding MO (σ*₁s)
                    </span>
                  </Html>
                </group>
              </group>
            )}
          </group>

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={5.0}
            maxDistance={15.0}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minPolarAngle={0.1}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      {/* ── INTRO MISSION & INSTRUCTIONS VIEW OVERLAY ────────────────────────── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-4 bg-white/80 backdrop-blur-md overflow-hidden">
          {/* Top Header Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation (Back to App)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION SCREEN */}
          {introStep === 'mission' && (
            <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-5 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-sm font-mono font-bold tracking-[0.25em] uppercase">
                MOLECULAR ORBITAL THEORY
              </div>

              <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
                <span className="text-[#2563EB]">MISSION:</span> Combine 1s atomic orbitals to form H₂ molecular orbitals (σ₁s &amp; σ*₁s)
              </h1>

              <div className="pt-1.5 sm:pt-2">
                <button
                  type="button"
                  onClick={() => setIntroStep('instructions')}
                  className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INSTRUCTIONS SCREEN */}
          {introStep === 'instructions' && (
            <div className="max-w-xl mx-auto my-auto text-center space-y-1.5 sm:space-y-2 z-10 px-2 sm:px-3 py-0.5 animate-in fade-in duration-200 w-full">
              <div className="text-[#1E293B] text-sm sm:text-base font-black tracking-wide">
                Instructions
              </div>

              <div className="space-y-2 text-left max-w-xl mx-auto">
                {/* 1. Tap 1s orbital */}
                <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-sm border border-slate-200/90 flex items-center justify-between gap-3 transition-all hover:border-blue-300">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm">
                      1
                    </div>
                    <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                      Tap on the 1s orbital to place into 3D space.
                    </p>
                  </div>
                  <div className="w-28 sm:w-36 h-14 sm:h-16 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-sm shrink-0 flex items-center justify-center p-0.5">
                    <img
                      src="/images/mot/l1_step1_place_orbital.svg"
                      alt="Step 1: Place 1s orbital"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* 2. Bring orbitals together */}
                <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-sm border border-slate-200/90 flex items-center justify-between gap-3 transition-all hover:border-blue-300">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm">
                      2
                    </div>
                    <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                      Tap on the Bring Orbitals Together button to unlock the Molecular Orbitals.
                    </p>
                  </div>
                  <div className="w-28 sm:w-36 h-14 sm:h-16 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-sm shrink-0 flex items-center justify-center p-0.5">
                    <img
                      src="/images/mot/l1_step2_bring_together.svg"
                      alt="Step 2: Bring orbitals together"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play */}
              <div className="pt-1.5 sm:pt-2 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep('mission')}
                  className="px-5 sm:px-6 py-1.5 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameStarted(true)}
                  className="px-6 sm:px-8 py-1.5 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Footer Note (Only on mission step) */}
          {introStep === 'mission' && (
            <div className="w-full text-center text-[9.5px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0">
              Click NEXT to view challenge instructions
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVE GAMEPLAY SCREEN (WHEN GAME STARTED) ───────────────────────── */}
      {gameStarted && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-2 sm:p-3">

          {/* ── 1. TOP TOOLBAR HEADER (EXIT, TARGET COMPLETED BADGE, EXPLANATION) ── */}
          <div className="w-full flex items-center justify-between pointer-events-auto z-30 gap-2">
            {/* Top Left: Exit Button Only (no back / fullscreen buttons) */}
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              title="Exit Simulation (Back to App)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Center: Target Completed Badge (shown with green light color as used in Level 1 & Level 2) */}
            {targetCompleted ? (
              <div className="bg-emerald-600/85 border border-emerald-400/60 backdrop-blur-md text-white px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl shadow-md flex items-center gap-2 select-none animate-in fade-in zoom-in-95 duration-300">
                <div className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-100 leading-tight">
                    Target Completed (100%)
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-medium text-white/95 leading-tight hidden xs:block">
                    H₂ Molecular Orbitals Formed (σ₁s &amp; σ*₁s)!
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Top Right: Explanation Button Only (no star button) */}
            <button
              type="button"
              onClick={() => setShowConceptsModal(true)}
              className="h-8 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 text-purple-700 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
              title="View Theory & Explanation"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Explanation</span>
            </button>
          </div>

          {/* ── 2. BOTTOM CONTROL DOCK (ONLY 1s ORBITAL AND BRING TOGETHER BUTTON) ── */}
          <div className="w-full flex justify-center items-center pointer-events-auto z-30 pb-1 sm:pb-1.5">
            <div className="bg-white/95 border border-slate-200 rounded-2xl p-1.5 sm:p-2 shadow-xl backdrop-blur-xl flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {/* Tray Title */}
              <div className="flex items-center gap-1 text-[#2563EB] text-[10px] sm:text-xs font-extrabold uppercase tracking-wider bg-blue-50 px-2 sm:px-2.5 py-1.5 rounded-xl border border-blue-200 shrink-0 select-none">
                <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Orbital:</span>
              </div>

              {/* 1s Orbital Button */}
              <button
                type="button"
                onClick={() => handleSelectOrbital('1s')}
                disabled={placedOrbitalCount >= 2}
                className={`px-3 sm:px-4 py-1.5 rounded-xl border transition-all flex items-center gap-2 shadow-xs select-none ${
                  placedOrbitalCount < 2
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-400 shadow-sky-500/20 cursor-pointer active:scale-95'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
                title="Tap to place 1s orbital into 3D space"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                  1s
                </div>
                <span className="font-extrabold text-xs">
                  1s Orbital
                </span>
              </button>

              {/* Bring Orbitals Together Button */}
              <button
                type="button"
                onClick={handleBringTogether}
                disabled={placedOrbitalCount < 2 || isCombining || targetCompleted}
                className={`px-4 sm:px-5 py-2 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 uppercase tracking-wider select-none ${
                  placedOrbitalCount === 2 && !isCombining && !targetCompleted
                    ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white cursor-pointer transform hover:scale-105 active:scale-95 shadow-blue-500/25'
                    : targetCompleted
                      ? 'bg-emerald-600 text-white opacity-95 cursor-default'
                      : 'bg-slate-200 text-[#64748B] border border-slate-300 cursor-not-allowed opacity-75'
                }`}
              >
                <MoveHorizontal className="w-4 h-4" />
                <span>
                  {isCombining ? 'Combining Orbitals...' : 'Bring Orbitals Together'}
                </span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── THEORY / EXPLANATION PAGE (BLACK FONT TEXTBOOK STYLE) ───────────── */}
      {showConceptsModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                Molecular Orbital Theory (MOT) Guide — Level 1: H₂ Formation
              </h2>
              <p className="text-xs text-neutral-600 font-normal">
                Linear Combination of Atomic Orbitals (LCAO), Bonding (σ₁s), Antibonding (σ*₁s), and Nodal Planes
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowConceptsModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-semibold text-xs transition-all cursor-pointer border border-neutral-300 active:scale-95"
            >
              <X className="w-4 h-4 text-black" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content Body (Pure Black Font, Generous Line Height, Mixed Paragraphs & Bullet Points) */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-7 space-y-6 sm:space-y-8 text-black text-xs sm:text-sm leading-relaxed max-w-3xl mx-auto w-full">
            
            {/* Section 1: Core Principles of MOT & LCAO */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                1. Core Principle of Molecular Orbital Theory (LCAO Principle)
              </h3>
              <p className="text-black leading-relaxed">
                In classical Lewis and Valence Bond structures, valence electrons are viewed as localized between pairs of bonded atoms. However, Molecular Orbital Theory (MOT), developed by Robert Mulliken and Friedrich Hund, establishes that electrons in molecules occupy quantum wavefunctions known as Molecular Orbitals (MOs) that are polycentric and delocalized across the entire molecule.
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Conservation of Orbitals Law:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Fundamental rule:</strong> When atomic orbitals combine, the total number of molecular orbitals formed must always strictly equal the number of combining atomic orbitals.
                </li>
                <li>
                  <strong>Linear combination for Hydrogen:</strong> 1s(A) + 1s(B) → 2 Molecular Orbitals: 1 Bonding (σ₁s) + 1 Antibonding (σ*₁s).
                </li>
                <li>
                  <strong>Delocalization:</strong> Unlike atomic orbitals centered on single nuclei, molecular orbitals span multiple atomic nuclei across the entire molecular frame.
                </li>
              </ul>
            </div>

            {/* Section 2: Bonding Molecular Orbital (sigma 1s) */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                2. In-Phase Wave Overlap → Bonding MO (σ₁s)
              </h3>
              <p className="text-black leading-relaxed">
                When two atomic wavefunctions overlap with the same sign/phase (+/+), they undergo constructive wave interference, creating a bonding molecular orbital.
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Mathematical Wave Addition &amp; Electrostatic Stabilization:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Wavefunction addition:</strong> ψ(bonding) = ψ_A + ψ_B.
                </li>
                <li>
                  <strong>Probability density accumulation:</strong> Squaring the wave equation yields electron probability density: |ψ_b|² = ψ_A² + ψ_B² + 2ψ_Aψ_B. The positive cross term (+2ψ_Aψ_B) represents an enhanced concentration of negative electron density accumulated directly in the internuclear region.
                </li>
                <li>
                  <strong>Nuclear shielding and attraction:</strong> This dense negative electron cloud shields the two positively charged Hydrogen nuclei from mutual electrostatic repulsion, while simultaneously attracting both nuclei inward.
                </li>
                <li>
                  <strong>Energy lowering:</strong> This significantly lowers the potential energy of the molecule relative to isolated atoms, resulting in a stable σ₁s covalent bond.
                </li>
              </ul>
            </div>

            {/* Section 3: Antibonding Molecular Orbital (sigma* 1s) */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                3. Out-of-Phase Wave Overlap → Antibonding MO (σ*₁s) &amp; Nodal Plane
              </h3>
              <p className="text-black leading-relaxed">
                When two 1s atomic orbitals overlap with opposite phases (+/-), they undergo destructive wave interference, generating an antibonding molecular orbital.
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Wave Subtraction &amp; Nodal Plane Formation:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Wavefunction subtraction:</strong> ψ(antibonding) = ψ_A - ψ_B.
                </li>
                <li>
                  <strong>Probability density depletion:</strong> Probability density |ψ_a|² = ψ_A² + ψ_B² - 2ψ_Aψ_B. The negative cross term (-2ψ_Aψ_B) reduces electron probability between the two nuclei to exactly zero.
                </li>
                <li>
                  <strong>Nodal plane:</strong> A planar boundary perpendicular to the internuclear axis where electron probability density is identically zero (ψ = 0).
                </li>
                <li>
                  <strong>Destabilizing nuclear repulsion:</strong> Because zero electron density exists between the nuclei, the two positively charged protons experience direct, unshielded electrostatic repulsion. Consequently, the σ*₁s orbital has significantly higher energy than isolated 1s atomic orbitals.
                </li>
              </ul>
            </div>

            {/* Section 4: Energy Level Diagram & Electron Configuration for H2 */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                4. Energy Level Diagram &amp; Electron Configuration for H₂
              </h3>
              <p className="text-black leading-relaxed">
                Molecular orbitals are filled in accordance with the Aufbau Principle (lowest energy first), the Pauli Exclusion Principle (maximum 2 electrons with opposite spins per orbital), and Hund&apos;s Rule.
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Electronic Structure Breakdown:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Isolated atoms:</strong> Hydrogen atom A (1s¹) and Hydrogen atom B (1s¹) bring a combined total of 2 valence electrons.
                </li>
                <li>
                  <strong>Ground state molecular configuration:</strong> (σ₁s)² (σ*₁s)⁰. Both electrons occupy the lower-energy bonding σ₁s orbital with paired, opposite spins (↑↓).
                </li>
                <li>
                  <strong>Antibonding vacancy:</strong> The higher-energy antibonding σ*₁s orbital remains completely empty in the ground state.
                </li>
                <li>
                  <strong>Magnetic properties:</strong> Because all electrons are paired (zero unpaired electrons), the H₂ molecule is diamagnetic and weakly repelled by magnetic fields.
                </li>
              </ul>
            </div>

            {/* Section 5: Bond Order Formula & He2 Non-existence */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                5. Bond Order Formula &amp; The He₂ Non-existence Proof
              </h3>
              <p className="text-black leading-relaxed">
                The stability of a diatomic molecule is quantitatively assessed using the concept of Bond Order, defined as half the difference between the number of bonding and antibonding electrons.
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Formula &amp; Comparative Analysis:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Formula:</strong> Bond Order = ½ × (Nb - Na), where Nb is the number of electrons in bonding molecular orbitals and Na is the number of electrons in antibonding molecular orbitals.
                </li>
                <li>
                  <strong>Hydrogen molecule (H₂):</strong> Nb = 2 (in σ₁s), Na = 0. Bond Order = ½ × (2 - 0) = 1.0. This corresponds to a stable single covalent bond with a bond dissociation energy of 436 kJ/mol and an equilibrium bond distance of 74 pm.
                </li>
                <li>
                  <strong>Helium dimer (He₂):</strong> Each Helium atom brings 2 electrons, giving 4 total electrons with configuration (σ₁s)² (σ*₁s)². Here Nb = 2 and Na = 2.
                </li>
                <li>
                  <strong>He₂ Bond Order:</strong> Bond Order = ½ × (2 - 2) = 0.0. Antibonding electron destabilization cancels out bonding stabilization, conclusively explaining why He₂ molecules cannot exist under standard conditions.
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-neutral-300 bg-white shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setShowConceptsModal(false)}
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
