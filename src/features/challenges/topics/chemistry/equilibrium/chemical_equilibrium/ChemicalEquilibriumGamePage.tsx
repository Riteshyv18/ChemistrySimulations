"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Trophy,
  RotateCcw,
  Play,
  Pause,
  Clock,
  TrendingDown,
  TrendingUp,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ============================================================================
// SIMULATION CONSTANTS & EQUILIBRIUM KINETICS CONFIG
// ============================================================================
const TOTAL_PARTICLES = 40;
const MAX_TIME = 30; // seconds of simulation
const KF = 0.15; // Forward rate constant
const KR = 0.10; // Reverse rate constant
// K_eq = KF / KR = 0.15 / 0.10 = 1.5
// Equilibrium: [B]_eq / [A]_eq = 1.5 => [B]_eq = 1.5 * [A]_eq
// [A]_eq + [B]_eq = 40 => 2.5 * [A]_eq = 40 => [A]_eq = 16, [B]_eq = 24.
// Equilibrium reached around t = 16s - 20s.
const EQUILIBRIUM_TIME_THRESHOLD = 16.0;

interface ParticleState {
  id: number;
  initialPos: THREE.Vector3;
  initialVel: THREE.Vector3;
}

// ============================================================================
// 3D SINGLE PARTICLE COMPONENT (Dynamically toggles Red/Blue)
// ============================================================================
function SingleParticle({
  def,
  isProduct,
  speedFactor,
  isRunning,
}: {
  def: ParticleState;
  isProduct: boolean;
  speedFactor: number;
  isRunning: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const posRef = useRef(def.initialPos.clone());
  const velRef = useRef(def.initialVel.clone());

  const minX = -2.55;
  const maxX = 2.55;
  const minY = -0.85;
  const maxY = 0.95;
  const minZ = -0.65;
  const maxZ = 0.65;

  useFrame((_, delta) => {
    if (!meshRef.current || !isRunning) return;
    const dt = Math.min(delta, 0.04);
    const speed = 1.4 * speedFactor;

    const p = posRef.current;
    const v = velRef.current;

    p.x += v.x * speed * dt;
    p.y += v.y * speed * dt;
    p.z += v.z * speed * dt;

    if (p.x <= minX) {
      p.x = minX;
      v.x = Math.abs(v.x);
    } else if (p.x >= maxX) {
      p.x = maxX;
      v.x = -Math.abs(v.x);
    }

    if (p.y <= minY) {
      p.y = minY;
      v.y = Math.abs(v.y);
    } else if (p.y >= maxY) {
      p.y = maxY;
      v.y = -Math.abs(v.y);
    }

    if (p.z <= minZ) {
      p.z = minZ;
      v.z = Math.abs(v.z);
    } else if (p.z >= maxZ) {
      p.z = maxZ;
      v.z = -Math.abs(v.z);
    }

    meshRef.current.position.copy(p);
  });

  return (
    <group ref={meshRef} position={def.initialPos}>
      <mesh>
        <sphereGeometry args={[0.085, 20, 20]} />
        <meshStandardMaterial
          color={isProduct ? "#0284C7" : "#E11D48"}
          roughness={0.25}
          metalness={0.4}
          emissive={isProduct ? "#0369A1" : "#BE123C"}
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// 3D REVERSIBLE REACTION CHAMBER (Extended width, centered)
// ============================================================================
function ReversibleChamberVisual() {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Outer Chamber Glass Box */}
      <mesh>
        <boxGeometry args={[5.3, 1.95, 1.5]} />
        <meshPhysicalMaterial
          color="#38BDF8"
          transmission={0.92}
          opacity={0.35}
          transparent
          roughness={0.1}
          ior={1.3}
          thickness={0.4}
        />
      </mesh>

      {/* Frame Beams */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(5.3, 1.95, 1.5)]} />
        <lineBasicMaterial color="#0284C7" linewidth={2} transparent opacity={0.65} />
      </lineSegments>

      {/* Chamber Floor Stand */}
      <mesh position={[0, -1.05, 0]}>
        <boxGeometry args={[5.6, 0.14, 1.8]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Top Pillar Caps */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[5.5, 0.08, 1.7]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

function ReactionScene({
  particleDefs,
  reactantCount,
  speedMultiplier,
  isRunning,
}: {
  particleDefs: ParticleState[];
  reactantCount: number;
  speedMultiplier: number;
  isRunning: boolean;
}) {
  return (
    <group position={[0, 0.65, 0]} scale={[0.76, 0.76, 0.76]}>
      <ReversibleChamberVisual />
      {particleDefs.map((p, idx) => (
        <SingleParticle
          key={p.id}
          def={p}
          isProduct={idx >= reactantCount}
          speedFactor={speedMultiplier}
          isRunning={isRunning}
        />
      ))}
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function ChemicalEquilibriumGamePage({
  difficulty = "level1",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  const exitSimulationHandler = () => {
    if (onExit) onExit();
    else exitSimulation();
  };

  // Screen Stages: "mission" -> "instructions" -> main game
  const [introStep, setIntroStep] = useState<"mission" | "instructions">("mission");
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Gameplay State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [score, setScore] = useState<number>(0);

  // Verification / Checkpoint State
  const [showCheckEquilibriumModal, setShowCheckEquilibriumModal] = useState<boolean>(false);
  const [equilibriumChecked, setEquilibriumChecked] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    correct: boolean;
    title: string;
    text: string;
  } | null>(null);

  // Modals
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);

  // Particles initial positions definition
  const particleDefs = useMemo(() => {
    const list: ParticleState[] = [];
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const x = (Math.random() - 0.5) * 4.6;
      const y = (Math.random() - 0.5) * 1.3;
      const z = (Math.random() - 0.5) * 1.1;

      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.5) * 0.9;
      const vx = Math.cos(angle);
      const vy = elev;
      const vz = Math.sin(angle);

      list.push({
        id: i,
        initialPos: new THREE.Vector3(x, y, z),
        initialVel: new THREE.Vector3(vx, vy, vz).normalize(),
      });
    }
    return list;
  }, []);

  // Kinetics Equation for Reversible Reaction: A <=> B
  // d[A]/dt = -kf*[A] + kr*[B]
  // Analytical Solution:
  // [A](t) = [A]_eq + ([A]_0 - [A]_eq) * exp(-(kf + kr) * t)
  // [B](t) = 40 - [A](t)
  const A_eq = (KR / (KF + KR)) * TOTAL_PARTICLES; // 16
  const B_eq = TOTAL_PARTICLES - A_eq; // 24
  const K_total = KF + KR; // 0.25

  const calculateAmounts = (t: number) => {
    const decay = Math.exp(-K_total * t);
    const a = A_eq + (TOTAL_PARTICLES - A_eq) * decay;
    const b = TOTAL_PARTICLES - a;
    const rf = KF * a; // forward rate
    const rr = KR * b; // reverse rate
    return {
      reactantA: Math.max(Math.round(a), 0),
      productB: Math.min(Math.round(b), TOTAL_PARTICLES),
      concA: (a / TOTAL_PARTICLES) * 1.0, // scale to 1.0 M
      concB: (b / TOTAL_PARTICLES) * 1.0,
      rateForward: rf,
      rateReverse: rr,
    };
  };

  const currentStats = useMemo(() => calculateAmounts(currentTime), [currentTime]);
  const reactantCount = currentStats.reactantA;
  const productCount = currentStats.productB;

  // Clock progression loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1 * speedMultiplier;
        if (next >= MAX_TIME) {
          setIsRunning(false);
          return MAX_TIME;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier]);

  const handleTogglePlay = () => {
    if (currentTime >= MAX_TIME) {
      setCurrentTime(0);
      setIsRunning(true);
      setEquilibriumChecked(false);
      setFeedbackMessage(null);
    } else {
      setIsRunning((r) => !r);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentTime(0);
    setEquilibriumChecked(false);
    setFeedbackMessage(null);
  };

  const handleVerifyEquilibrium = () => {
    setIsRunning(false);
    setShowCheckEquilibriumModal(true);
  };

  const handleConfirmEquilibriumCheck = () => {
    setShowCheckEquilibriumModal(false);
    const isAtEquilibrium = currentTime >= EQUILIBRIUM_TIME_THRESHOLD;

    if (isAtEquilibrium) {
      setScore(300);
      setEquilibriumChecked(true);
      setFeedbackMessage({
        correct: true,
        title: "Dynamic Equilibrium Established!",
        text: `Awesome observation! Forward rate (rf) equals reverse rate (rr) at ~${currentStats.rateForward.toFixed(2)} conversions/sec, and concentrations have completely stabilized ([A] = 16, [B] = 24).`,
      });
      setShowVictoryModal(true);
    } else {
      setFeedbackMessage({
        correct: false,
        title: "Not at Equilibrium Yet!",
        text: `The forward reaction is still faster than reverse reaction (rf > rr). Watch the live curve until both rates converge and flatten out!`,
      });
    }
  };

  // SVG Live Convergence Graph dimensions (Expanded height for tall clear curve display)
  const graphWidth = 720;
  const graphHeight = 115;
  const graphPadding = { top: 6, bottom: 18, left: 35, right: 15 };
  const innerW = graphWidth - graphPadding.left - graphPadding.right;
  const innerH = graphHeight - graphPadding.top - graphPadding.bottom;

  // Precomputed rate paths
  const { forwardPath, reversePath } = useMemo(() => {
    const fPoints: string[] = [];
    const rPoints: string[] = [];
    const steps = 70;
    const tMax = Math.max(currentTime, 0.05);
    const maxRate = KF * TOTAL_PARTICLES; // 6.0 max forward rate

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tMax;
      const stats = calculateAmounts(t);
      const x = graphPadding.left + (t / MAX_TIME) * innerW;
      const yF = graphPadding.top + innerH - (stats.rateForward / maxRate) * innerH;
      const yR = graphPadding.top + innerH - (stats.rateReverse / maxRate) * innerH;

      fPoints.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${yF.toFixed(1)}`);
      rPoints.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${yR.toFixed(1)}`);
    }

    return {
      forwardPath: fPoints.join(" "),
      reversePath: rPoints.join(" "),
    };
  }, [currentTime, innerW, innerH]);

  const scrubberX = graphPadding.left + (currentTime / MAX_TIME) * innerW;
  const eqX = graphPadding.left + (EQUILIBRIUM_TIME_THRESHOLD / MAX_TIME) * innerW;

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 0: MISSION INTRO SCREEN (Single-Liner Hero Style)
          ══════════════════════════════════════════════════════════════════════ */}
      {!gameStarted && introStep === "mission" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
          {/* Top Bar: Exit Button */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={exitSimulationHandler}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>EXIT</span>
            </button>
            <div className="w-16" />
          </div>

          {/* Centered Single-Liner Mission Statement */}
          <div className="max-w-2xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              <span className="text-[#0284C7]">MISSION:</span> Observe the reversible reaction and discover the exact moment equilibrium is reached!
            </h1>

            <div>
              <button
                type="button"
                onClick={() => setIntroStep("instructions")}
                className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 inline-flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>
          </div>

          <div className="h-8 shrink-0" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 1: INSTRUCTIONS TO PLAY (3 Step Guidance Cards)
          ══════════════════════════════════════════════════════════════════════ */}
      {!gameStarted && introStep === "instructions" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
          {/* Top Header */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={exitSimulationHandler}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>EXIT</span>
            </button>

            {/* Title Pill */}
            <div className="flex items-center gap-2">
              <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
              <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-[11px] sm:text-xs tracking-wider flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                <span>INSTRUCTIONS TO PLAY</span>
              </div>
              <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
            </div>

            <div className="w-16" />
          </div>

          {/* 3 Step Guidance Cards */}
          <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">
              {/* Card 1: Live Rate Convergence Curve */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Monitor Live Rates Curve
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[9px]">
                      Forward (rf) &amp; Reverse (rr)
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Observe the forward (rf) and reverse (rr) reaction rates as the reaction progresses over time.
                  </p>
                </div>

                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/eq_convergence_curve.png"
                    alt="Live Rate Convergence Graph"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Card 2: Control Panel & Speed */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Control Panel &amp; Speed
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-extrabold text-[9px]">
                      Speed: 1x, 2x, 4x
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Start the reaction, monitor the clock, and accelerate time (1x, 2x, 4x) to reach equilibrium faster.
                  </p>
                </div>

                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/eq_control_panel.png"
                    alt="Reaction Control Panel"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Card 3: Identify Dynamic Equilibrium */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Confirm Equilibrium State
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px]">
                      Target: rf = rr &amp; Stable [A], [B]
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    When rates become equal and concentrations flatten out, click &ldquo;IDENTIFY EQUILIBRIUM&rdquo; and submit!
                  </p>
                </div>

                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/eq_verify_modal.png"
                    alt="Confirm Equilibrium Verification"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Back and Play Buttons */}
          <div className="pt-2 pb-5 sm:pb-7 flex items-center justify-center gap-3 sm:gap-4 shrink-0 z-10">
            <button
              type="button"
              onClick={() => setIntroStep("mission")}
              className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 stroke-[3]" />
              <span>BACK</span>
            </button>
            <button
              type="button"
              onClick={() => setGameStarted(true)}
              className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1"
            >
              <Play className="w-3.5 h-3.5 text-sky-200 fill-current" />
              <span>PLAY</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 2: MAIN 3D SIMULATION SCREEN
          ══════════════════════════════════════════════════════════════════════ */}
      {gameStarted && (
        <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
          {/* LAYER 0: FULL-SCREEN 3D THREE.JS WEBGL CANVAS */}
          <div className="absolute inset-0 z-0">
            <Canvas gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[0, 0.55, 6.8]} fov={34} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 8, 5]} intensity={1.3} castShadow />
              <directionalLight position={[-5, 4, -3]} intensity={0.6} />
              <pointLight position={[0, 0.7, 0]} intensity={0.6} color="#38BDF8" />

              <gridHelper args={[10, 20, "#E2E8F0", "#F1F5F9"]} position={[0, -0.45, 0]} />

              <Suspense fallback={null}>
                <ReactionScene
                  particleDefs={particleDefs}
                  reactantCount={reactantCount}
                  speedMultiplier={speedMultiplier}
                  isRunning={isRunning}
                />
              </Suspense>

              <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 2.6}
                maxPolarAngle={Math.PI / 1.9}
                minAzimuthAngle={-Math.PI / 8}
                maxAzimuthAngle={Math.PI / 8}
              />
            </Canvas>
          </div>

          {/* LAYER 1: TOP BAR HEADER */}
          <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-2 pb-0.5 z-30 shrink-0">
            {/* Exit Button */}
            <button
              type="button"
              onClick={exitSimulationHandler}
              className="flex items-center gap-1.5 h-7 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-md transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Explanation Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="flex items-center gap-1.5 h-7 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* LAYER 2: TOP-CENTER PARTICLE STATUS PILL */}
          <div className="w-full flex justify-center px-4 sm:px-6 pointer-events-none z-20 pt-1">
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E11D48] shadow-xs" />
                <span className="text-[10px] font-bold text-slate-900">
                  Reactant A: <strong className="text-rose-600 font-black">{reactantCount}</strong>
                </span>
              </div>
              <div className="h-2.5 w-[1px] bg-slate-300" />
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0284C7] shadow-xs" />
                <span className="text-[10px] font-bold text-slate-900">
                  Product B: <strong className="text-sky-600 font-black">{productCount}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Flexible spacer so chamber has full screen height & width */}
          <div className="flex-1 pointer-events-none" />

          {/* Feedback banner if user guessed equilibrium too early */}
          {feedbackMessage && !feedbackMessage.correct && (
            <div className="w-full max-w-xl mx-auto px-4 z-30 mb-1 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-amber-50/95 backdrop-blur-md border border-amber-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-amber-900 shadow-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight">{feedbackMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="text-amber-600 hover:text-amber-800 text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              LAYER 3: BOTTOM DOCK — 80% LIVE CONVERGENCE GRAPH / 20% CONTROLS
              ────────────────────────────────────────────────────────────────── */}
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-2 z-20">
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              {/* Left / Main Card: Live Rate Convergence Curve (80% of width) */}
              <div className="w-full sm:w-[80%] bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-200/90 flex flex-col justify-between">
                <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                      LIVE RATES: FORWARD (rf) &amp; REVERSE (rr) VS. TIME
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-black">
                    <span className="text-rose-700 flex items-center gap-1">
                      <span className="w-2.5 h-1 bg-rose-700 rounded-full inline-block" /> Forward Rate (rf)
                    </span>
                    <span className="text-sky-700 flex items-center gap-1">
                      <span className="w-2.5 h-1 bg-sky-700 rounded-full inline-block" /> Reverse Rate (rr)
                    </span>
                  </div>
                </div>

                {/* SVG Live Convergence Graph */}
                <div className="relative w-full h-[115px] mt-0.5">
                  <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
                    {/* Axes */}
                    <line
                      x1={graphPadding.left}
                      y1={graphPadding.top}
                      x2={graphPadding.left}
                      y2={graphPadding.top + innerH}
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={graphPadding.left}
                      y1={graphPadding.top + innerH}
                      x2={graphPadding.left + innerW}
                      y2={graphPadding.top + innerH}
                      stroke="#475569"
                      strokeWidth="1.5"
                    />

                    {/* Y-Axis Label */}
                    <text
                      x={graphPadding.left - 4}
                      y={graphPadding.top + 5}
                      textAnchor="end"
                      className="text-[9px] fill-slate-950 font-mono font-black"
                    >
                      Rate
                    </text>

                    {/* Time ticks without hints (10s and 25s only) */}
                    <text
                      x={graphPadding.left + (10 / MAX_TIME) * innerW}
                      y={graphPadding.top + innerH + 11}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-bold fill-slate-700"
                    >
                      10s
                    </text>
                    <text
                      x={graphPadding.left + (25 / MAX_TIME) * innerW}
                      y={graphPadding.top + innerH + 11}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-bold fill-slate-700"
                    >
                      25s
                    </text>

                    {/* Live Curves - Darker and Bolder stroke */}
                    {currentTime > 0 && (
                      <>
                        {/* Forward Rate (Dark Red) */}
                        <path
                          d={forwardPath}
                          fill="none"
                          stroke="#BE123C"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                        {/* Reverse Rate (Dark Blue) */}
                        <path
                          d={reversePath}
                          fill="none"
                          stroke="#0369A1"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                      </>
                    )}

                    {/* Live Scrubber Indicator */}
                    {currentTime > 0 && (
                      <g>
                        <line
                          x1={scrubberX}
                          y1={graphPadding.top}
                          x2={scrubberX}
                          y2={graphPadding.top + innerH}
                          stroke="#64748B"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        <circle cx={scrubberX} cy={graphPadding.top + innerH / 2} r="3" fill="#0284C7" />
                      </g>
                    )}
                  </svg>
                </div>
              </div>

              {/* Right Card: Next to Live Decay Curve — Clock, Speed & Actions (20% of width) */}
              <div className="w-full sm:w-[20%] bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-200/90 flex flex-col justify-between shrink-0">
                {/* Clock Mini-Stat */}
                <div className="bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-700 uppercase">
                    <Clock className="w-3 h-3 text-sky-600" /> CLOCK
                  </div>
                  <div className="text-xs font-black font-mono text-slate-950">
                    {currentTime.toFixed(1)}<span className="text-[9.5px] text-slate-600 ml-0.5">s</span>
                  </div>
                </div>

                {/* Speed Multiplier */}
                <div className="flex items-center justify-between py-1 px-1 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black uppercase text-slate-700 tracking-wider">SPEED:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {[1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setSpeedMultiplier(spd)}
                        className={`px-2 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer ${
                          speedMultiplier === spd
                            ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                            : "text-slate-700 hover:text-black"
                        }`}
                      >
                        {spd}×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: START/PAUSE + IDENTIFY EQUILIBRIUM */}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className={`w-full py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 ${
                      isRunning
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                        : "bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-600/30"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>PAUSE</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>{currentTime >= MAX_TIME ? "REPLAY" : "START REACTION"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifyEquilibrium}
                    disabled={currentTime === 0}
                    className={`w-full py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 ${
                      currentTime === 0
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>IDENTIFY EQUILIBRIUM</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              LAYER 4: CONFIRM EQUILIBRIUM MODAL
              ────────────────────────────────────────────────────────────────── */}
          {showCheckEquilibriumModal && (
            <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-center space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Has Dynamic Equilibrium Been Reached?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Check the live curves: Are the forward (rf) and reverse (rr) rates equal and concentrations stable?
                  </p>
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckEquilibriumModal(false);
                      setIsRunning(true);
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Keep Observing
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmEquilibriumCheck}
                    className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    Yes, Submit Check!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              LAYER 5: VICTORY MODAL (300 Pts, REPLAY & EXPLANATION)
              ────────────────────────────────────────────────────────────────── */}
          {showVictoryModal && (
            <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
              <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-center space-y-2.5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-md">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <div>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    MISSION COMPLETE • 300 PTS
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    Equilibrium Master!
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-tight">
                    You accurately identified the point of dynamic equilibrium! Forward and reverse reactions continue at equal rates ($r_f = r_r$).
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-left font-mono text-[10px] sm:text-[11px] space-y-0.5 text-slate-800">
                  <div className="font-sans font-bold text-slate-700">Equilibrium State Summary:</div>
                  <div>• Forward Rate (rf) = Reverse Rate (rr) = <strong>~2.40 / s</strong></div>
                  <div>• Reactant A = <strong>16 particles</strong> (0.40 M)</div>
                  <div>• Product B = <strong>24 particles</strong> (0.60 M)</div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-700 font-sans font-semibold pt-0.5">
                    Notice: Equal rates does NOT mean equal amounts ([A] ≠ [B])!
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVictoryModal(false);
                      handleReset();
                    }}
                    className="flex-1 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>REPLAY</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowVictoryModal(false);
                      setShowExplanationModal(true);
                    }}
                    className="flex-1 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>EXPLANATION</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              SCREEN 3 / LAYER 6: EXPLANATION MODAL (Clean Full-Screen Rounded Modal)
              ────────────────────────────────────────────────────────────────── */}
          {showExplanationModal && (
            <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white/98 backdrop-blur-md animate-in fade-in duration-150 rounded-3xl sm:rounded-[32px]">
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-white">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Chemical Equilibrium &amp; Reversible Reactions Guide
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                    Module 06: Chemical Equilibrium • Topic 01: Dynamic Equilibrium
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExplanationModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Explanation Content */}
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 space-y-6 text-slate-700 leading-relaxed font-sans text-xs sm:text-sm">
                {/* 1. What is Dynamic Equilibrium? */}
                <div className="space-y-3 bg-sky-50/70 p-4 rounded-2xl border border-sky-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                    PART 1: THE CORE SCIENCE CONCEPT
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    What is Dynamic Equilibrium?
                  </h3>
                  <p className="text-slate-600">
                    In a closed container, many chemical reactions do not go 100% to completion in only one direction. Instead, they are <strong>reversible</strong>:
                  </p>
                  <div className="text-center font-mono font-black text-sm text-sky-950 bg-white p-2.5 rounded-xl border border-sky-200">
                    Reactant A &nbsp;⇌&nbsp; Product B
                  </div>
                  
                  {/* Initial Starting State Context */}
                  <div className="bg-white/80 p-2.5 rounded-xl border border-sky-200/80 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-sky-900">
                      Initial State (At t = 0s):
                    </p>
                    <p>
                      The reaction begins with <strong>40 Reactant A</strong> particles and <strong>0 Product B</strong> particles.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Because only Reactant A exists initially, the forward reaction starts at maximum speed, while the reverse reaction is 0. As A converts to B, B begins turning back into A!
                    </p>
                  </div>

                  <p className="text-slate-600 text-xs">
                    Reactants turn into products (forward reaction), and at the same time, products turn back into reactants (reverse reaction)!
                  </p>
                </div>

                {/* 2. The Big Question: "Why Reactant A = 16 and Product B = 24 instead of 20 and 20?" */}
                <div className="space-y-3 border-l-4 border-amber-500 pl-3.5 sm:pl-4 py-1">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    2. The Big Question: &ldquo;Why is Reactant A = 16 and Product B = 24 (instead of 20 and 20)?&rdquo;
                  </h4>
                  <p className="text-slate-700 font-semibold">
                    Almost every beginner student asks: <em>&ldquo;Equilibrium means equal, so shouldn&apos;t Reactant A and Product B both be 20 and 20?&rdquo;</em>
                  </p>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-950 space-y-2">
                    <p className="font-extrabold text-amber-900">
                      The Golden Rule of Chemistry: Equilibrium means EQUAL SPEEDS (RATES), NOT equal amounts!
                    </p>
                    <p className="text-slate-700">
                      <strong>The Real-Life Store Analogy:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                      <li>Outside waiting in line (<strong>Reactant A</strong>) = <strong>16 people</strong>.</li>
                      <li>Inside the store (<strong>Product B</strong>) = <strong>24 shoppers</strong>.</li>
                      <li>Every minute, <strong>2 people enter</strong> the store (Forward speed = 2).</li>
                      <li>Every minute, <strong>2 people leave</strong> the store (Reverse speed = 2).</li>
                    </ul>
                    <p className="text-slate-800 font-semibold pt-1">
                      Notice: Rate in = Rate out = 2 people/min. The count of <strong>Reactant A</strong> stays at <strong>16</strong> and <strong>Product B</strong> stays at <strong>24</strong> forever! They do not need to be 20 and 20, yet the system is in perfect equilibrium!
                    </p>
                  </div>
                </div>

                {/* 3. The Math Behind It */}
                <div className="space-y-3 border-l-4 border-emerald-500 pl-3.5 sm:pl-4 py-1">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    3. The Chemistry Math (Different Stabilities)
                  </h4>
                  <p className="text-slate-600 text-xs">
                    Reactant A and Product B have different stabilities. Molecule A converts into B slightly faster than B converts into A:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
                    <div>• Forward Rate = kf × [A] = 0.15 × 16 = <strong>2.40 / sec</strong></div>
                    <div>• Reverse Rate = kr × [B] = 0.10 × 24 = <strong>2.40 / sec</strong></div>
                    <div className="text-emerald-700 font-bold font-sans pt-1">
                      At Equilibrium: Forward Rate (2.40) = Reverse Rate (2.40)
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Because both speeds are exactly equal, no net change occurs. [A] stays at 16 and [B] stays at 24.
                  </p>
                </div>

                {/* 4. Why is it Called "Dynamic"? */}
                <div className="space-y-3 border-l-4 border-indigo-500 pl-3.5 sm:pl-4 py-1">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    4. Why is it Called &ldquo;Dynamic&rdquo;?
                  </h4>
                  <p className="text-slate-600">
                    Even after the lines on the graph flatten out and amounts stop changing, individual molecules <strong>NEVER stop reacting</strong>!
                  </p>
                  <p className="text-slate-600 text-xs">
                    Molecules of A are still constantly turning into B, and molecules of B are constantly turning into A at the exact same speed. That is why it is called <strong>DYNAMIC</strong> (active and moving) rather than static (frozen).
                  </p>
                </div>
              </div>

              {/* Bottom Resume Challenge Button */}
              <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowExplanationModal(false)}
                  className="px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  RESUME CHALLENGE
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChemicalEquilibriumGamePage;
