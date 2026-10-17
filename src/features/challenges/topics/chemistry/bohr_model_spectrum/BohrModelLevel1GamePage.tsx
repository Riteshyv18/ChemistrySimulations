"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Sparkles as DreiSparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  BookOpen,
  Play,
  ArrowLeft,
  RotateCcw,
  Zap,
  Radio,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';
import {
  getNucleusMaterial,
  getNucleusGlowMaterial,
  getOrbitRingMaterial,
  getElectronMaterial,
  getPhotonPacketMaterial
} from './bohr-materials';
import { BOHR_QUANTUM_LEVELS, BOHR_STAGES } from './bohr-data';
import { PhotonOption, QuantumLevel } from './bohr-types';

// ── Responsive 3D Camera for Bohr Orbits ────────────────────────────────────
const AdaptiveBohrCamera = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    // Ensure all 4 circular energy levels (n=4 diameter 5.20) fill the card nicely (~93% width) with safe margins
    const aspect = size.width / Math.max(1, size.height);
    const targetWidth = 5.65; // Calibrated for larger radii (n=4 diameter 5.20) to maximize size while fitting cleanly
    const fov = 46;
    const fovRad = (fov * Math.PI) / 180;
    const requiredDist = targetWidth / (2 * Math.tan(fovRad / 2) * aspect);
    const finalDist = Math.max(8.2, requiredDist);

    camera.position.set(0, finalDist, 0.001);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera]);

  return null;
};

// ── 3D Nucleus Component (Proton) ──────────────────────────────────────────
const Nucleus3D = ({ hideLabel = false }: { hideLabel?: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreMat = useMemo(() => getNucleusMaterial(), []);
  const glowMat = useMemo(() => getNucleusGlowMaterial(), []);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer aura glow */}
      <Sphere ref={meshRef} args={[0.34, 24, 24]} material={glowMat} />
      {/* Core proton sphere */}
      <Sphere args={[0.24, 32, 32]} material={coreMat} />
      {!hideLabel && (
        <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
          <div className="text-[10px] font-black font-mono text-white pointer-events-none drop-shadow select-none">
            p⁺
          </div>
        </Html>
      )}
    </group>
  );
};

const OrbitRing3D = ({
  level,
  isActive,
  isTarget,
  hideLabel = false,
}: {
  level: QuantumLevel;
  isActive: boolean;
  isTarget: boolean;
  hideLabel?: boolean;
}) => {
  // Bold, dark circular lines that are clearly visible on a pure white background
  const ringColor = isTarget ? '#059669' : isActive ? '#0284C7' : '#0F172A';
  const tubeRadius = isTarget ? 0.034 : isActive ? 0.030 : 0.024;

  // Stagger label positions directly at top of each circle
  const lx = 0;
  const lz = -level.radius;

  return (
    <group>
      {/* Solid 3D Torus Ring (Bold and crisp on white background) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[level.radius, tubeRadius, 16, 128]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={isTarget ? 0.45 : isActive ? 0.35 : 0.05}
          roughness={0.2}
        />
      </mesh>

      {/* Orbit label floating in 3D (Clean, legible rectangle box) */}
      {!hideLabel && (
        <Html position={[lx, 0, lz]} center zIndexRange={[80, 0]}>
          <div
            className={`px-2.5 py-0.5 rounded-md text-[10.5px] sm:text-[11.5px] font-mono font-bold tracking-tight border shadow-xs select-none whitespace-nowrap transition-all ${
              isTarget
                ? 'bg-emerald-50 text-emerald-900 border-emerald-500 font-extrabold ring-2 ring-emerald-300 scale-105'
                : isActive
                ? 'bg-sky-50 text-sky-950 border-sky-500 font-extrabold ring-2 ring-sky-300 scale-105'
                : 'bg-white text-slate-800 border-slate-400 font-bold shadow-xs'
            }`}
          >
            n={level.n} ({level.energy} eV)
          </div>
        </Html>
      )}
    </group>
  );
};

// ── 3D Orbiting Electron with Quantum Leap ──────────────────────────────────
const OrbitingElectron3D = ({
  currentRadius,
  targetRadius,
  isTransitioning,
  isExcited,
  hideLabel = false,
}: {
  currentRadius: number;
  targetRadius: number;
  isTransitioning: boolean;
  isExcited: boolean;
  hideLabel?: boolean;
}) => {
  const electronRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0);
  const radiusRef = useRef(currentRadius);
  const mat = useMemo(() => getElectronMaterial(), []);

  useFrame((state, delta) => {
    const speed = 2.4 / Math.sqrt(Math.max(1, radiusRef.current));
    angleRef.current += delta * speed;

    // Smooth quantum jump interpolation
    radiusRef.current = THREE.MathUtils.lerp(radiusRef.current, targetRadius, delta * 6);

    const x = Math.cos(angleRef.current) * radiusRef.current;
    const z = Math.sin(angleRef.current) * radiusRef.current;

    if (electronRef.current) {
      electronRef.current.position.set(x, 0, z);
      if (isExcited) {
        const jitter = Math.sin(state.clock.elapsedTime * 25) * 0.03;
        electronRef.current.position.y = jitter;
      } else {
        electronRef.current.position.y = 0;
      }
    }
  });

  return (
    <group ref={electronRef} position={[currentRadius, 0, 0]}>
      {/* Enriched and enlarged moving electron sphere */}
      <Sphere args={[0.20, 32, 32]} material={mat} />
      {/* Glow halo */}
      <Sphere args={[0.32, 24, 24]}>
        <meshBasicMaterial
          color={isExcited ? '#F59E0B' : '#0284C7'}
          transparent
          opacity={isTransitioning ? 0.75 : 0.3}
        />
      </Sphere>

      {!hideLabel && (
        <Html position={[0, 0.32, 0]} center zIndexRange={[120, 0]}>
          <div className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded-full bg-blue-600 text-white border border-blue-300 shadow-sm pointer-events-none select-none">
            e⁻
          </div>
        </Html>
      )}
    </group>
  );
};

// ── 3D Flying Photon Wave Packet Animation ──────────────────────────────────
const PhotonWavePacket3D = ({
  active,
  mode,
  color,
  onComplete,
}: {
  active: boolean;
  mode: 'absorb' | 'emit';
  color: string;
  onComplete?: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const mat = useMemo(() => getPhotonPacketMaterial(color), [color]);

  useEffect(() => {
    progressRef.current = 0;
  }, [active, mode]);

  useFrame((_, delta) => {
    if (!active || !groupRef.current) return;

    progressRef.current += delta * 1.6;
    const p = Math.min(1, progressRef.current);

    if (mode === 'absorb') {
      const dist = THREE.MathUtils.lerp(3.7, 0.1, p);
      groupRef.current.position.set(dist, Math.sin(p * Math.PI * 8) * 0.2, 0);
    } else {
      const dist = THREE.MathUtils.lerp(0.2, 3.8, p);
      groupRef.current.position.set(dist, Math.sin(p * Math.PI * 8) * 0.2, 0);
    }

    if (p >= 1 && onComplete) {
      onComplete();
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={[mode === 'absorb' ? 3.7 : 0.2, 0, 0]}>
      <Sphere args={[0.15, 24, 24]} material={mat} />
      <Sphere args={[0.28, 24, 24]}>
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </Sphere>
      <DreiSparkles count={15} scale={0.7} size={2.5} speed={0.4} color={color} />
    </group>
  );
};

// ── Main Game Component ─────────────────────────────────────────────────────
export interface BohrModelLevel1GamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function BohrModelLevel1GamePage({
  difficulty = 'level1',
  onExit,
}: BohrModelLevel1GamePageProps) {
  // Game Flow State
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  // Bohr Atom State
  const stage = BOHR_STAGES[currentStageIdx];
  const [currentN, setCurrentN] = useState(stage.initialN);
  const [targetN, setTargetN] = useState(stage.targetN);
  const [isExcited, setIsExcited] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Photon & Animation State
  const [photonFlight, setPhotonFlight] = useState<{
    active: boolean;
    mode: 'absorb' | 'emit';
    color: string;
  }>({ active: false, mode: 'absorb', color: '#0284C7' });

  // Feedback & Emission Result
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [emittedPhotonDetails, setEmittedPhotonDetails] = useState<{
    wavelength: number;
    series: string;
    color: string;
    energy: number;
  } | null>(null);

  // Modals
  const [showConceptsModal, setShowConceptsModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // History for Revert button
  const [history, setHistory] = useState<
    Array<{
      stageIdx: number;
      currentN: number;
      isExcited: boolean;
    }>
  >([]);

  // Reset stage when moving stages
  useEffect(() => {
    setCurrentN(stage.initialN);
    setTargetN(stage.targetN);
    setIsExcited(false);
    setIsTransitioning(false);
    setFeedback({
      type: 'info',
      message: `Find the exact resonant photon to excite the electron from n = ${stage.initialN} to n = ${stage.targetN}.`,
    });
    setEmittedPhotonDetails(null);
  }, [currentStageIdx]);

  // Radii calculation
  const currentRadius = useMemo(() => {
    const lvl = BOHR_QUANTUM_LEVELS.find((l) => l.n === currentN);
    return lvl ? lvl.radius : 0.80;
  }, [currentN]);

  const targetRadius = useMemo(() => {
    const lvl = BOHR_QUANTUM_LEVELS.find((l) => l.n === (isExcited ? targetN : currentN));
    return lvl ? lvl.radius : currentRadius;
  }, [isExcited, targetN, currentN, currentRadius]);

  // Current Delta E required
  const requiredDeltaE = useMemo(() => {
    const initialLvl = BOHR_QUANTUM_LEVELS.find((l) => l.n === stage.initialN);
    const targetLvl = BOHR_QUANTUM_LEVELS.find((l) => l.n === stage.targetN);
    if (!initialLvl || !targetLvl) return 0;
    return parseFloat((targetLvl.energy - initialLvl.energy).toFixed(2));
  }, [stage]);

  // Handle Photon Selection / Injection
  const handleSelectPhoton = (photon: PhotonOption) => {
    if (isExcited || isTransitioning) return;

    // Save history for Revert
    setHistory((prev) => [
      ...prev,
      { stageIdx: currentStageIdx, currentN, isExcited },
    ]);

    // Check if photon energy matches exact delta E required
    const isMatch = Math.abs(photon.energy - requiredDeltaE) < 0.05;

    // Trigger incoming photon animation
    setPhotonFlight({
      active: true,
      mode: 'absorb',
      color: photon.color,
    });

    if (isMatch) {
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentN(stage.targetN);
        setIsExcited(true);
        setPhotonFlight({ active: false, mode: 'absorb', color: photon.color });

        setFeedback({
          type: 'success',
          message: `Resonance Achieved! Electron absorbed ${photon.energy} eV and quantum-jumped to n = ${stage.targetN}! Now trigger relaxation to emit light.`,
        });

        setTimeout(() => setIsTransitioning(false), 600);
      }, 700);
    } else {
      setTimeout(() => {
        setPhotonFlight({ active: false, mode: 'absorb', color: photon.color });
        setFeedback({
          type: 'error',
          message: `Quantization Mismatch! ${photon.energy} eV does not match ΔE (${requiredDeltaE} eV). The electron cannot absorb non-resonant energy!`,
        });
      }, 700);
    }
  };

  // Handle De-excitation / Emission Trigger
  const handleTriggerEmission = () => {
    if (!isExcited || isTransitioning) return;

    const finalN = stage.deExciteTargetN || stage.initialN;
    const initialLvl = BOHR_QUANTUM_LEVELS.find((l) => l.n === currentN);
    const finalLvl = BOHR_QUANTUM_LEVELS.find((l) => l.n === finalN);
    const deltaE = initialLvl && finalLvl ? parseFloat(Math.abs(initialLvl.energy - finalLvl.energy).toFixed(2)) : 10.2;
    const wavelength = stage.expectedEmissionWavelength || parseFloat((1239.84 / deltaE).toFixed(1));

    setIsTransitioning(true);
    setCurrentN(finalN);
    setIsExcited(false);

    // Save history
    setHistory((prev) => [
      ...prev,
      { stageIdx: currentStageIdx, currentN, isExcited },
    ]);

    // Trigger outward flying emitted photon
    setPhotonFlight({
      active: true,
      mode: 'emit',
      color: stage.expectedEmissionColor || '#A855F7',
    });

    setEmittedPhotonDetails({
      wavelength,
      series: stage.expectedEmissionSeries || 'Lyman Series',
      color: stage.expectedEmissionColor || '#A855F7',
      energy: deltaE,
    });

    setFeedback({
      type: 'success',
      message: `Photon Emitted! Dropped n = ${stage.targetN} → ${finalN}. Emitted ${deltaE} eV light (λ = ${wavelength} nm, ${stage.expectedEmissionSeries})!`,
    });

    setTimeout(() => {
      setIsTransitioning(false);
      setPhotonFlight({ active: false, mode: 'emit', color: stage.expectedEmissionColor || '#A855F7' });

      // If last stage, complete simulation!
      if (currentStageIdx >= BOHR_STAGES.length - 1) {
        setIsCompleted(true);
      }
    }, 1200);
  };

  // Next Stage Button
  const handleNextStage = () => {
    if (currentStageIdx < BOHR_STAGES.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Revert Button
  const handleRevert = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setCurrentStageIdx(previousState.stageIdx);
    setCurrentN(previousState.currentN);
    setIsExcited(previousState.isExcited);
    setEmittedPhotonDetails(null);
    setFeedback({
      type: 'info',
      message: 'Reverted to previous step.',
    });
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-1.5 sm:p-2.5">
      
      {/* ── INTRO MISSION & INSTRUCTIONS VIEW OVERLAY ────────────────────────── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION SCREEN (EXACTLY MATCHING IMAGE 1) */}
          {introStep === 'mission' && (
            <div className="max-w-xl mx-auto my-auto text-center space-y-3 sm:space-y-4 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                BOHR'S ATOMIC MODEL
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                <span className="text-[#2563EB]">MISSION:</span> Atomic Energy Lab — Absorb & Release Photons to Excite & De-Excite Electron
              </h1>

              <div className="pt-2 sm:pt-4">
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

          {/* STEP 2: INSTRUCTIONS SCREEN (EXACTLY MATCHING IMAGE 2) */}
          {introStep === 'instructions' && (
            <div className="max-w-md mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-4 py-1 animate-in fade-in duration-200 w-full flex-1">
              <div className="text-center pt-1 pb-3">
                <h2 className="text-[#1E293B] text-base sm:text-lg font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              <div className="flex flex-col gap-3 w-full mx-auto my-auto">
                {/* 1. Tap on Correct Photon Energy */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Tap on Correct Photon Energy
                      </h3>
                    </div>
                    <div className="mt-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] tracking-wide">
                        Photon Energy Packets
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                      Tap on the correct photon energy packet to jump into the excited energy level.
                    </p>
                  </div>

                  {/* Visual Preview Box (Matching Image 2: Photon Energy Packets) */}
                  <div className="w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-xs p-2.5 mt-2.5 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Radio className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="text-[11px] font-black text-slate-800">
                        Photon Energy Packets (Select Resonant Energy)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* 10.20 eV Resonant Option */}
                      <div className="py-2.5 px-1.5 rounded-xl border border-sky-300 bg-white shadow-xs flex flex-col items-center justify-center ring-2 ring-sky-200/80">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-xs" />
                          <span className="text-xs font-black font-mono text-slate-900">
                            10.20 eV
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 text-center font-medium">
                          Lyman (UV)
                        </div>
                      </div>

                      {/* 7.50 eV Non-resonant Option */}
                      <div className="py-2.5 px-1.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col items-center justify-center opacity-85">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-xs" />
                          <span className="text-xs font-black font-mono text-slate-900">
                            7.50 eV
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 text-center font-medium">
                          Photon Packet
                        </div>
                      </div>

                      {/* 12.09 eV Non-resonant Option */}
                      <div className="py-2.5 px-1.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col items-center justify-center opacity-85">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-xs" />
                          <span className="text-xs font-black font-mono text-slate-900">
                            12.09 eV
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 text-center font-medium">
                          Lyman (UV)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Release & Observe Spectral Light */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Release & Observe Light
                      </h3>
                    </div>
                    <div className="mt-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] tracking-wide">
                        Photon Emission
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                      Tap Trigger Photon Emission to drop the electron back down and emit light (Lyman UV or Balmer Red).
                    </p>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2 mt-2.5">
                    <svg viewBox="0 0 320 120" className="w-full h-full">
                      {/* Nucleus */}
                      <circle cx="160" cy="60" r="14" fill="#EF4444" />
                      <text x="160" y="64" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">p⁺</text>
                      {/* Orbits */}
                      <circle cx="160" cy="60" r="30" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx="160" cy="60" r="48" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" />
                      {/* Downward transition indicator */}
                      <line x1="160" y1="12" x2="160" y2="28" stroke="#EF4444" strokeWidth="2" strokeDasharray="2 2" />
                      {/* Electron on n=1 */}
                      <circle cx="160" cy="30" r="6" fill="#0284C7" />
                      {/* Outgoing photon wave */}
                      <path d="M 175 30 Q 195 20 215 30 T 255 30 L 280 30" fill="none" stroke="#EF4444" strokeWidth="2.5" />
                      <polygon points="284,30 276,26 276,34" fill="#EF4444" />
                      <rect x="200" y="44" width="95" height="18" rx="5" fill="#EF4444" opacity="0.3" />
                      <text x="247" y="57" textAnchor="middle" fill="#F87171" fontSize="9.5" fontWeight="bold">λ = 656.3 nm (Red)</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play */}
              <div className="pt-3 pb-1 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep('mission')}
                  className="px-6 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
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

          {/* Bottom Footer Note (Only on mission step) */}
          {introStep === 'mission' && (
            <div className="w-full text-center text-[9.5px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0 pb-1">
              Click NEXT to view challenge instructions
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN 3: ACTIVE 3D GAMEPLAY SCREEN (EXACTLY MATCHING IMAGE 3) ──── */}
      {gameStarted && (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          
          {/* ── 1. TOP TOOLBAR HEADER (EXIT, REVERT, EXPLANATION) ── */}
          <header className="w-full flex items-center justify-between z-20 gap-2 shrink-0 py-1 mb-1.5">
            {/* Top Left: Exit Button */}
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Center: Target Completed Badge */}
            {isCompleted ? (
              <div className="bg-emerald-600/90 border border-emerald-400 text-white px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 select-none animate-in fade-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  Target Completed (100%)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-xs">
                {BOHR_STAGES.map((s, idx) => (
                  <span
                    key={s.id}
                    className={`text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full transition-all ${
                      idx < currentStageIdx
                        ? 'bg-emerald-100 text-emerald-800 font-extrabold shadow-2xs'
                        : idx === currentStageIdx
                        ? 'bg-blue-100 text-[#2563EB] font-extrabold ring-1 ring-blue-300 shadow-2xs'
                        : 'text-slate-400 bg-slate-50'
                    }`}
                  >
                    S{s.id}
                  </span>
                ))}
              </div>
            )}

            {/* Top Right: Revert & Explanation Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRevert}
                disabled={history.length === 0}
                className={`h-8 px-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all shadow-sm ${
                  history.length > 0
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 cursor-pointer active:scale-95'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                }`}
                title="Revert previous step"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Revert</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConceptsModal(true)}
                className="h-8 px-2.5 sm:px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 text-purple-700 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                title="View Bohr Theory & Explanation"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                <span>Explanation</span>
              </button>
            </div>
          </header>

          {/* ── 2. CENTER STAGE: 3D BOHR ATOM (CLEAN WHITE CARD) ── */}
          <main className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-sm flex-1 min-h-0 flex flex-col justify-between overflow-hidden relative mb-2">
            
            {/* 3D WebGL Canvas (Pure White Background, Fixed Top-Down Geometry) */}
            <div className="flex-1 w-full min-h-0 relative rounded-xl overflow-hidden bg-white">
              <Canvas camera={{ position: [0, 10.4, 0.001], fov: 46 }}>
                <AdaptiveBohrCamera />
                <color attach="background" args={['#FFFFFF']} />
                <ambientLight intensity={0.95} />
                <pointLight position={[10, 15, 10]} intensity={1.2} />
                <pointLight position={[-10, -10, -10]} intensity={0.6} />

                {/* Central Proton Nucleus */}
                <Nucleus3D hideLabel={showConceptsModal} />

                {/* Bohr Quantized Orbits (n = 1, 2, 3, 4) */}
                {BOHR_QUANTUM_LEVELS.map((lvl) => (
                  <OrbitRing3D
                    key={lvl.n}
                    level={lvl}
                    isActive={currentN === lvl.n}
                    isTarget={targetN === lvl.n && !isExcited}
                    hideLabel={showConceptsModal}
                  />
                ))}

                {/* Orbiting Electron with smooth quantum leap */}
                <OrbitingElectron3D
                  currentRadius={currentRadius}
                  targetRadius={targetRadius}
                  isTransitioning={isTransitioning}
                  isExcited={isExcited}
                  hideLabel={showConceptsModal}
                />

                {/* Incoming / Outgoing Photon Wave Packet Animation */}
                <PhotonWavePacket3D
                  active={photonFlight.active}
                  mode={photonFlight.mode}
                  color={photonFlight.color}
                />

                {/* Fixed positioning: No extending, shrinking, or deforming of circular shapes */}
                <OrbitControls
                  enablePan={false}
                  enableZoom={false}
                  enableRotate={false}
                />
              </Canvas>
            </div>

            {/* Dynamic Feedback Bar */}
            {feedback && (
              <div
                className={`mt-1.5 p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold shadow-xs transition-all z-10 shrink-0 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : feedback.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                    : 'bg-sky-50 border-sky-200 text-sky-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                ) : feedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <Zap className="w-4 h-4 text-[#2563EB] shrink-0" />
                )}
                <span className="flex-1">{feedback.message}</span>
              </div>
            )}

            {/* Recorded Emission Popup Card */}
            {emittedPhotonDetails && (
              <div className="mt-1.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50 flex items-center justify-between gap-2 z-10 shrink-0 shadow-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
                    style={{ backgroundColor: emittedPhotonDetails.color }}
                  />
                  <div>
                    <div className="text-[11px] font-black text-purple-900">
                      Emission: λ = {emittedPhotonDetails.wavelength} nm ({emittedPhotonDetails.series})
                    </div>
                    <div className="text-[9.5px] text-purple-700">
                      Released ΔE = {emittedPhotonDetails.energy} eV light photon!
                    </div>
                  </div>
                </div>

                {currentStageIdx < BOHR_STAGES.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStage}
                    className="py-1 px-3 rounded-lg bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs uppercase flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 shrink-0"
                  >
                    <span>Stage {currentStageIdx + 2}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCompleted(true)}
                    className="py-1 px-3 rounded-lg bg-[#0284C7] hover:bg-sky-700 text-white font-bold text-xs uppercase flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 shrink-0"
                  >
                    <Trophy className="w-3 h-3 fill-current" />
                    <span>Complete</span>
                  </button>
                )}
              </div>
            )}
          </main>

          {/* ── 3. BOTTOM PHOTON TRAY / EMISSION ACTION (MATCHING IMAGE 3) ──────── */}
          <footer className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-sm shrink-0">
            {!isExcited ? (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Radio className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-black text-[#1E293B]">
                    Photon Energy Packets (Select Resonant Energy)
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {stage.photons.map((p) => {
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPhoton(p)}
                        disabled={isTransitioning}
                        className="h-20 sm:h-22 py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-xs"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="text-xs sm:text-sm font-black font-mono text-[#1E293B]">
                            {p.label}
                          </span>
                        </div>
                        <div className="text-[9px] text-[#64748B] text-center leading-tight">
                          {p.series || 'Photon Packet'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center font-black shrink-0">
                    <Zap className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#1E293B]">
                      Electron Energized at n = {stage.targetN} (Excited State)!
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      State is unstable. Release energy to return to lower orbit and observe emitted light.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerEmission}
                  disabled={isTransitioning}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Trigger Photon Emission</span>
                </button>
              </div>
            )}
          </footer>
        </div>
      )}

      {/* ── 4. THEORY / EXPLANATION PAGE (BLACK FONT TEXTBOOK STYLE MATCHING MOT LEVEL 2) ─── */}
      {showConceptsModal && (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                Bohr&apos;s Atomic Model &amp; Hydrogen Spectrum
              </h2>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowConceptsModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-semibold text-xs transition-all cursor-pointer border border-neutral-300 active:scale-95 shrink-0"
            >
              <X className="w-4 h-4 text-black" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content Body (Pure Black Font, Generous Line Height, Mixed Paragraphs & Bullet Points) */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-7 sm:space-y-8 text-black text-base sm:text-lg leading-relaxed max-w-3xl mx-auto w-full">
            
            {/* Section 1: Quantized Energy Levels of the Hydrogen Atom */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                1. Quantized Energy Levels of Hydrogen (n = 1, 2, 3, 4)
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                In the Bohr model, the electron revolves around the central nucleus in discrete, stable circular orbits without radiating energy. The energy of an electron at principal quantum level n is given by:
              </p>
              <div className="my-2 p-2.5 bg-neutral-100 border border-neutral-300 rounded-xl font-mono text-center font-bold text-black">
                Eₙ = - 13.60 eV / n²
              </div>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Ground State (n = 1):</strong> E₁ = -13.60 eV / 1² = <strong>-13.60 eV</strong>. This is the lowest and most stable energy state, closest to the nucleus. Completely removing this electron requires +13.60 eV of ionization energy.
                </li>
                <li>
                  <strong>First Excited State (n = 2):</strong> E₂ = -13.60 eV / 2² = <strong>-3.40 eV</strong>.
                </li>
                <li>
                  <strong>Second Excited State (n = 3):</strong> E₃ = -13.60 eV / 3² = <strong>-1.51 eV</strong>.
                </li>
                <li>
                  <strong>Third Excited State (n = 4):</strong> E₄ = -13.60 eV / 4² = <strong>-0.85 eV</strong>.
                </li>
                <li>
                  <strong>Meaning of Negative Energy:</strong> The negative value indicates the electron is bound to the proton nucleus. As n increases, the electron moves farther from the nucleus and its energy increases toward 0 eV (unbound free electron).
                </li>
              </ul>
            </div>

            {/* Section 2: Resonant Photon Absorption & Quantum Jumps */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                2. Resonant Photon Absorption &amp; Quantum Jumps
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                An electron can only absorb an incoming photon whose energy exactly matches the difference between two quantum orbits:
              </p>
              <div className="my-2 p-2.5 bg-neutral-100 border border-neutral-300 rounded-xl font-mono text-center font-bold text-black">
                ΔE = E_target - E_initial = hν = (h · c) / λ
              </div>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Stage 1 (n = 1 → 2 Jump):</strong>
                  <br />
                  ΔE = (-3.40 eV) - (-13.60 eV) = <strong>+10.20 eV</strong>. Absorbing the 10.20 eV resonant photon causes the electron to quantum-jump to n = 2.
                </li>
                <li>
                  <strong>Why Non-Resonant Energy Fails (e.g. 7.50 eV):</strong>
                  <br />
                  Because there are no intermediate orbits between n = 1 and n = 2, the electron cannot absorb partial or non-resonant photons. Energy absorption is strictly quantized.
                </li>
                <li>
                  <strong>Stage 2 (n = 1 → 3 Jump):</strong>
                  <br />
                  ΔE = (-1.51 eV) - (-13.60 eV) = <strong>+12.09 eV</strong>.
                </li>
                <li>
                  <strong>Stage 3 (n = 1 → 4 Jump):</strong>
                  <br />
                  ΔE = (-0.85 eV) - (-13.60 eV) = <strong>+12.75 eV</strong>.
                </li>
              </ul>
            </div>

            {/* Section 3: Spontaneous De-Excitation & Photon Emission */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                3. Spontaneous De-Excitation &amp; Photon Emission
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Electrons in excited states (n &gt; 1) are unstable and drop back down to lower energy levels, releasing the exact energy gap as a photon of light:
              </p>
              <div className="my-2 p-2.5 bg-neutral-100 border border-neutral-300 rounded-xl font-mono text-center font-bold text-black">
                λ = (h · c) / ΔE = 1240 eV·nm / ΔE
              </div>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Ultraviolet UV Emission (Stage 1, n = 2 → 1):</strong>
                  <br />
                  ΔE = 10.20 eV &emsp;⇒&emsp; λ = 1240 / 10.20 = <strong>121.6 nm (Lyman-α, UV Light)</strong>.
                </li>
                <li>
                  <strong>Visible Crimson Red Emission (Stage 2, n = 3 → 2):</strong>
                  <br />
                  ΔE = (-1.51 eV) - (-3.40 eV) = 1.89 eV &emsp;⇒&emsp; λ = 1240 / 1.89 = <strong>656.3 nm (Balmer H-α, Red Light)</strong>.
                </li>
                <li>
                  <strong>Visible Cyan Emission (Stage 3, n = 4 → 2):</strong>
                  <br />
                  ΔE = (-0.85 eV) - (-3.40 eV) = 2.55 eV &emsp;⇒&emsp; λ = 1240 / 2.55 = <strong>486.1 nm (Balmer H-β, Cyan Light)</strong>.
                </li>
              </ul>
            </div>

            {/* Section 4: Hydrogen Spectral Series (Lyman vs. Balmer) */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                4. Hydrogen Spectral Series (Lyman vs. Balmer Series)
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Hydrogen emission lines are classified into distinct series based on the final energy level (n₁) to which the electron falls:
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Lyman Series (n₁ = 1, n₂ = 2, 3, 4, ...):</strong> Transitions ending at the ground state (n = 1). Large energy gaps result in <strong>Ultraviolet (UV)</strong> radiation.
                </li>
                <li>
                  <strong>Balmer Series (n₁ = 2, n₂ = 3, 4, 5, ...):</strong> Transitions ending at n = 2. These transitions fall within the <strong>Visible Light spectrum</strong> (400 nm to 700 nm), producing the characteristic colorful lines observed in the lab.
                </li>
              </ul>
            </div>

            {/* Section 5: 3D Simulation Elements & Mechanics */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                5. 3D Simulation Elements &amp; Gameplay Mechanics
              </h3>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Central Proton Nucleus (p⁺):</strong> Creates the positive electrostatic attraction holding the orbiting electron.
                </li>
                <li>
                  <strong>Concentric Orbits (n = 1 to 4):</strong> Permissible stationary tracks where the electron orbits without radiating.
                </li>
                <li>
                  <strong>Moving Electron (e⁻):</strong> Moves along circular orbits and performs quantum jumps upon resonant photon absorption.
                </li>
                <li>
                  <strong>Photon Wave Packet:</strong> Energy packet (hν) absorbed during excitation and emitted during de-excitation.
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

      {/* ── VICTORY / COMPLETION MODAL ─────────────────────────────────────── */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-[#22C55E] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Trophy className="w-8 h-8 fill-current" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#1E293B] uppercase tracking-wide mb-1">
              Challenge Completed!
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mb-4">
              Mastery achieved in Bohr’s Atomic Energy Lab. You successfully proved energy quantization, absorption leaps, and spectral emissions!
            </p>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-5 text-left text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Lyman Series</span>
                <span className="font-bold text-purple-700">121.6 nm (UV)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Balmer Series</span>
                <span className="font-bold text-rose-600">656.3 nm (H-α)</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setCurrentStageIdx(0);
                  setHistory([]);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Replay Lab
              </button>

              <button
                type="button"
                onClick={() => (onExit ? onExit() : exitSimulation())}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-xs uppercase shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Back to Topics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
