"use client";

import React, { useState, useMemo, useRef, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Trophy,
  CheckCircle2,
  X,
  Play,
  Pause,
  Zap,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  Target,
  FlaskConical,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ============================================================================
// CONSTANTS & GAMEPLAY SPECS
// First-Order Reaction: A -> B
// Initial Concentration [A]0 = 1.000 M
// Half-life t_1/2 = 10 s
// Checkpoints: 10s (0.500 M), 20s (0.250 M), 30s (0.125 M)
// ============================================================================

const INITIAL_CONC = 1.0;
const HALF_LIFE = 10.0;
const MAX_MISSION_TIME = 30.0;
const TOTAL_PARTICLES = 40;

interface CheckpointData {
  time: number;
  expectedConc: number;
  expectedPercent: number;
  title: string;
  subtitle: string;
  options: { label: string; value: number }[];
}

const CHECKPOINTS: CheckpointData[] = [
  {
    time: 10,
    expectedConc: 0.5,
    expectedPercent: 50,
    title: "Checkpoint 1 — 1st Half-Life (10s)",
    subtitle: "10 seconds have elapsed (1 half-life). Predict the remaining concentration of Reactant A!",
    options: [
      { label: "0.750 M (75%)", value: 0.75 },
      { label: "0.500 M (50%)", value: 0.5 },
      { label: "0.333 M (33%)", value: 0.333 },
      { label: "0.250 M (25%)", value: 0.25 },
    ],
  },
  {
    time: 20,
    expectedConc: 0.25,
    expectedPercent: 25,
    title: "Checkpoint 2 — 2nd Half-Life (20s)",
    subtitle: "20 seconds have elapsed (2 half-lives). How much Reactant A remains after another halving?",
    options: [
      { label: "0.375 M (37.5%)", value: 0.375 },
      { label: "0.250 M (25%)", value: 0.25 },
      { label: "0.125 M (12.5%)", value: 0.125 },
      { label: "0.050 M (5%)", value: 0.05 },
    ],
  },
  {
    time: 30,
    expectedConc: 0.125,
    expectedPercent: 12.5,
    title: "Checkpoint 3 — 3rd Half-Life (30s)",
    subtitle: "30 seconds have elapsed (3 half-lives). Final prediction to complete the mission!",
    options: [
      { label: "0.187 M (18.7%)", value: 0.187 },
      { label: "0.125 M (12.5%)", value: 0.125 },
      { label: "0.062 M (6.2%)", value: 0.062 },
      { label: "0.000 M (0%)", value: 0.0 },
    ],
  },
];

// ============================================================================
// 3D REACTION CHAMBER & PARTICLE ANIMATION
// ============================================================================

interface ParticleState {
  id: number;
  initialPos: THREE.Vector3;
  initialVel: THREE.Vector3;
}

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

  const minX = -1.9;
  const maxX = 1.9;
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

function ReactionChamberVisual() {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Outer Chamber Glass Box */}
      <mesh>
        <boxGeometry args={[4.0, 1.95, 1.5]} />
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
        <edgesGeometry args={[new THREE.BoxGeometry(4.0, 1.95, 1.5)]} />
        <lineBasicMaterial color="#0284C7" linewidth={2} transparent opacity={0.65} />
      </lineSegments>

      {/* Chamber Floor Stand */}
      <mesh position={[0, -1.05, 0]}>
        <boxGeometry args={[4.3, 0.14, 1.8]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Top Pillar Caps */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[4.2, 0.08, 1.7]} />
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
    <group position={[-0.45, 0.45, 0]} scale={[0.88, 0.88, 0.88]}>
      <ReactionChamberVisual />
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

export function RateLawHalfLifeGamePage({
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

  // --------------------------------------------------------------------------
  // GAMEPLAY STATE
  // --------------------------------------------------------------------------
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [score, setScore] = useState<number>(0);

  // Checkpoints status
  const [completedCheckpoints, setCompletedCheckpoints] = useState<boolean[]>([false, false, false]);
  const [activeCheckpointIdx, setActiveCheckpointIdx] = useState<number | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<number | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState<{
    correct: boolean;
    text: string;
  } | null>(null);

  // Modals
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);

  // Particles initial positions definition
  const particleDefs = useMemo(() => {
    const list: ParticleState[] = [];
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const x = (Math.random() - 0.5) * 3.4;
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

  const currentConc = useMemo(() => {
    return Math.max(INITIAL_CONC * Math.pow(0.5, currentTime / HALF_LIFE), 0.0001);
  }, [currentTime]);

  const percentRemaining = (currentConc / INITIAL_CONC) * 100;

  const reactantCount = useMemo(() => {
    return Math.round(TOTAL_PARTICLES * Math.pow(0.5, currentTime / HALF_LIFE));
  }, [currentTime]);

  const productCount = TOTAL_PARTICLES - reactantCount;

  // Clock ticker
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const nextTime = Math.min(prev + 0.1 * speedMultiplier, MAX_MISSION_TIME);

        // Checkpoint detection at 10s, 20s, 30s
        for (let i = 0; i < CHECKPOINTS.length; i++) {
          const cp = CHECKPOINTS[i];
          if (!completedCheckpoints[i] && prev < cp.time && nextTime >= cp.time) {
            setIsRunning(false);
            setActiveCheckpointIdx(i);
            setSelectedPrediction(null);
            setCheckpointFeedback(null);
            return cp.time;
          }
        }

        if (nextTime >= MAX_MISSION_TIME) {
          setIsRunning(false);
          if (completedCheckpoints.every(Boolean)) {
            setShowVictoryModal(true);
          }
        }

        return nextTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier, completedCheckpoints]);

  const handleTogglePlay = () => {
    if (activeCheckpointIdx !== null) return;
    if (currentTime >= MAX_MISSION_TIME) {
      handleReset();
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentTime(0);
    setScore(0);
    setCompletedCheckpoints([false, false, false]);
    setActiveCheckpointIdx(null);
    setSelectedPrediction(null);
    setCheckpointFeedback(null);
    setShowVictoryModal(false);
  };

  const handleSubmitPrediction = () => {
    if (activeCheckpointIdx === null || selectedPrediction === null) return;
    const cp = CHECKPOINTS[activeCheckpointIdx];
    const isCorrect = Math.abs(selectedPrediction - cp.expectedConc) < 0.01;

    if (isCorrect) {
      setScore((s) => s + 100);
      setCheckpointFeedback({
        correct: true,
        text: `Spot on! At t = ${cp.time}s, [A] decreases by half to exactly ${cp.expectedConc.toFixed(
          3
        )} M (${cp.expectedPercent}%).`,
      });

      const updated = [...completedCheckpoints];
      updated[activeCheckpointIdx] = true;
      setCompletedCheckpoints(updated);
    } else {
      setCheckpointFeedback({
        correct: false,
        text: `Incorrect prediction! Each half-life (10s) cuts the concentration by 50%. The reaction resets to the initial stage so you can try again.`,
      });
    }
  };

  const handleResumeAfterCheckpoint = () => {
    // If answer was incorrect, reset completely to initial stage (0s)
    if (checkpointFeedback && !checkpointFeedback.correct) {
      handleReset();
      return;
    }

    const nextCpIdx = activeCheckpointIdx;
    setActiveCheckpointIdx(null);
    setSelectedPrediction(null);
    setCheckpointFeedback(null);

    if (nextCpIdx === 2) {
      setShowVictoryModal(true);
    } else {
      setIsRunning(true);
    }
  };

  // SVG live graph dimensions (increased height for clear visibility)
  const graphWidth = 720;
  const graphHeight = 82;
  const graphPadding = { top: 10, bottom: 20, left: 45, right: 25 };
  const innerW = graphWidth - graphPadding.left - graphPadding.right;
  const innerH = graphHeight - graphPadding.top - graphPadding.bottom;

  const livePath = useMemo(() => {
    const points: string[] = [];
    const steps = 70;
    const tMax = Math.max(currentTime, 0.05);

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tMax;
      const c = INITIAL_CONC * Math.pow(0.5, t / HALF_LIFE);
      const x = graphPadding.left + (t / MAX_MISSION_TIME) * innerW;
      const y = graphPadding.top + innerH - (c / INITIAL_CONC) * innerH;
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return points.join(" ");
  }, [currentTime, innerW, innerH]);

  const scrubberX = graphPadding.left + (currentTime / MAX_MISSION_TIME) * innerW;
  const scrubberY = graphPadding.top + innerH - (currentConc / INITIAL_CONC) * innerH;

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 0: MISSION INTRO SCREEN
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
              <span className="text-[#0284C7]">MISSION:</span> Control the reaction clock and predict reactant concentration after successive half-lives!
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
          SCREEN 1: INSTRUCTIONS TO PLAY (3 Guidance Cards)
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
              {/* Card 1: 3D Reaction Chamber */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      3D Reaction Chamber
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[9px]">
                      Reactant A (40) → Product B (0)
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Observe the 3D reaction chamber. Watch Reactant A particles decay and transform into Product B over time.
                  </p>
                </div>

                {/* Card 1 Graphic: Actual Chamber Image */}
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900/5 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/half_life_chamber.png"
                    alt="3D Reaction Chamber"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>

              {/* Card 2: Live Decay Curve */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Live Decay Curve
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-extrabold text-[9px]">
                      10s, 20s, 30s Checkpoints
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Track concentration vs. time. At each checkpoint (10s, 20s, 30s), predict the remaining reactant concentration.
                  </p>
                </div>

                {/* Card 2 Graphic: Actual Decay Curve Image */}
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900/5 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/half_life_graph.png"
                    alt="Live Decay Curve"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Card 3: Reaction Control Panel */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Control Panel &amp; Speed
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px]">
                      Clock &amp; Speed: 1x, 2x, 4x
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Start the reaction, monitor the clock and remaining concentration, and adjust playback speed between 1x, 2x, and 4x.
                  </p>
                </div>

                {/* Card 3 Graphic: Actual Control Panel Image */}
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900/5 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/half_life_control.png"
                    alt="Reaction Control Panel"
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
              <Play className="w-3.5 h-3.5 fill-current" />
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
          {/* ──────────────────────────────────────────────────────────────────
              LAYER 0: FULL-SCREEN 3D THREE.JS WEBGL CANVAS
              ────────────────────────────────────────────────────────────────── */}
          <div className="absolute inset-0 z-0">
            <Canvas gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[0, 0.4, 6.2]} fov={34} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 8, 5]} intensity={1.3} castShadow />
              <directionalLight position={[-5, 4, -3]} intensity={0.6} />
              <pointLight position={[0, 0.7, 0]} intensity={0.6} color="#38BDF8" />

              <gridHelper args={[8, 16, "#E2E8F0", "#F1F5F9"]} position={[-0.45, -0.65, 0]} />

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

          {/* ──────────────────────────────────────────────────────────────────
              LAYER 1: TOP BAR HEADER
              ────────────────────────────────────────────────────────────────── */}
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

          {/* ──────────────────────────────────────────────────────────────────
              LAYER 2: THREE-COLUMN MID-HUD OVERLAY
              ────────────────────────────────────────────────────────────────── */}
          <div className="w-full flex-1 flex items-center justify-between px-4 sm:px-6 pointer-events-none z-20 my-auto">
            {/* CENTRE: Unobstructed view with live particle legend (perfectly centered above the chamber) */}
            <div className="flex flex-col items-center pointer-events-none mx-auto mb-auto pt-1">
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

            {/* AREA 3: RIGHT DOCK (Time Controls & Concentration Display - Vertically Centered) */}
            <div className="w-60 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-200/90 pointer-events-auto space-y-2 shrink-0">
              {/* Live Reaction Clock & Concentration */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-0.5 text-[9px] font-black text-slate-900 uppercase tracking-wider">
                    <Clock className="w-2.5 h-2.5 text-sky-600" /> CLOCK
                  </div>
                  <div className="text-base font-black font-mono text-slate-950 tracking-tight">
                    {currentTime.toFixed(1)} <span className="text-[10px] font-bold text-slate-700">s</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-0.5 text-[9px] font-black text-slate-900 uppercase tracking-wider">
                    <FlaskConical className="w-2.5 h-2.5 text-rose-600" /> [A] REM
                  </div>
                  <div className="text-base font-black font-mono text-rose-700 tracking-tight">
                    {currentConc.toFixed(3)} <span className="text-[10px] font-bold text-slate-700">M</span>
                  </div>
                </div>
              </div>

              {/* Progress Gauge */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[9px] font-black text-slate-900">
                  <span>Reactant Remaining:</span>
                  <span className="font-mono text-rose-700 font-black">{percentRemaining.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-rose-500 rounded-full transition-all duration-200"
                    style={{ width: `${percentRemaining}%` }}
                  />
                </div>
              </div>

              {/* Speed Multiplier & Action Controls */}
              <div className="pt-1 border-t border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-900">
                    SPEED:
                  </span>
                  <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {[1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setSpeedMultiplier(spd)}
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-black transition-all cursor-pointer ${
                          speedMultiplier === spd
                            ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                            : "text-slate-900 hover:text-black"
                        }`}
                      >
                        {spd}×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start/Pause and Reset Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className={`flex-1 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer active:scale-95 ${
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
                        <span>{currentTime >= MAX_MISSION_TIME ? "REPLAY" : "START REACTION"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Reset Reaction"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              LAYER 3: AREA 4 — BOTTOM LIVE SYNCHRONIZED DECAY GRAPH
              ────────────────────────────────────────────────────────────────── */}
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-2 z-20">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-slate-200/90 flex flex-col justify-between">
              <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                    LIVE DECAY CURVE: [A] VS. TIME
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[9px] font-black text-slate-900">
                  <span>10s Checkpoint</span>
                  <span>•</span>
                  <span>20s Checkpoint</span>
                  <span>•</span>
                  <span>30s Checkpoint</span>
                </div>
              </div>

              {/* SVG Live Graph */}
              <div className="relative w-full h-[82px] mt-1">
                <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
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

                  {/* Y-Axis Label - Only 1.0M, No 0.5M or 0.0M hints */}
                  <text
                    x={graphPadding.left - 5}
                    y={graphPadding.top + 3}
                    textAnchor="end"
                    className="text-[8.5px] fill-slate-950 font-mono font-black"
                  >
                    1.0M
                  </text>

                  {/* Checkpoint Markers (Showing ONLY Time, No Concentration Hints) */}
                  {CHECKPOINTS.map((cp, idx) => {
                    const x = graphPadding.left + (cp.time / MAX_MISSION_TIME) * innerW;
                    const isDone = completedCheckpoints[idx];

                    return (
                      <g key={idx}>
                        <line
                          x1={x}
                          y1={graphPadding.top}
                          x2={x}
                          y2={graphPadding.top + innerH}
                          stroke={isDone ? "#059669" : "#64748B"}
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={x}
                          cy={graphPadding.top + innerH - (cp.expectedConc / INITIAL_CONC) * innerH}
                          r="3.5"
                          fill={isDone ? "#059669" : "#334155"}
                        />
                        <text
                          x={x}
                          y={graphPadding.top + innerH + 13}
                          textAnchor="middle"
                          className={`text-[8.5px] font-mono font-black ${
                            isDone ? "fill-emerald-800" : "fill-slate-950"
                          }`}
                        >
                          {cp.time}s
                        </text>
                      </g>
                    );
                  })}

                  {/* Live Curve Path */}
                  {currentTime > 0 && (
                    <path
                      d={livePath}
                      fill="none"
                      stroke="#E11D48"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Live Scrubber Indicator */}
                  {currentTime > 0 && (
                    <g>
                      <line
                        x1={scrubberX}
                        y1={graphPadding.top}
                        x2={scrubberX}
                        y2={graphPadding.top + innerH}
                        stroke="#E11D48"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <circle cx={scrubberX} cy={scrubberY} r="3.5" fill="#E11D48" />
                      <circle cx={scrubberX} cy={scrubberY} r="6" fill="#E11D48" opacity="0.3" />
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              LAYER 4: CHECKPOINT PREDICTION CHALLENGE MODAL
              ────────────────────────────────────────────────────────────────── */}
          {activeCheckpointIdx !== null && (
            <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                        {CHECKPOINTS[activeCheckpointIdx].title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Half-Life Prediction Challenge
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 font-medium text-xs sm:text-sm mt-3 leading-relaxed">
                  {CHECKPOINTS[activeCheckpointIdx].subtitle}
                </p>

                {/* Options Selection */}
                <div className="grid grid-cols-2 gap-2.5 my-4">
                  {CHECKPOINTS[activeCheckpointIdx].options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={checkpointFeedback !== null}
                      onClick={() => setSelectedPrediction(opt.value)}
                      className={`py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                        selectedPrediction === opt.value
                          ? "border-[#0284C7] bg-sky-50 text-sky-800 shadow-sm ring-2 ring-sky-400"
                          : "border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Feedback Alert */}
                {checkpointFeedback && (
                  <div
                    className={`p-3 rounded-2xl border text-xs font-semibold mb-3 ${
                      checkpointFeedback.correct
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    {checkpointFeedback.text}
                  </div>
                )}

                {/* Submit / Continue / Retry Button */}
                <div className="flex justify-end pt-2">
                  {!checkpointFeedback ? (
                    <button
                      type="button"
                      disabled={selectedPrediction === null}
                      onClick={handleSubmitPrediction}
                      className="w-full py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
                    >
                      SUBMIT PREDICTION
                    </button>
                  ) : checkpointFeedback.correct ? (
                    <button
                      type="button"
                      onClick={handleResumeAfterCheckpoint}
                      className="w-full py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>CONTINUE REACTION</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResumeAfterCheckpoint}
                      className="w-full py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>TRY AGAIN (RESTART AT 0s)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              LAYER 5: VICTORY & SUMMARY MODAL
              ────────────────────────────────────────────────────────────────── */}
          {showVictoryModal && (
            <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-600 shadow-md">
                  <Trophy className="w-8 h-8" />
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1">
                  Mission Accomplished!
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm mb-4">
                  You successfully mastered the first-order half-life relationship across 3 complete half-lives!
                </p>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 mb-4 space-y-1.5 text-xs text-left">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Initial Concentration:</span>
                    <span className="font-bold text-slate-800">1.000 M (100%)</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Final (at 30s):</span>
                    <span className="font-bold text-emerald-600">0.125 M (12.5%)</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Total Score Earned:</span>
                    <span className="font-bold text-amber-600">{score} / 300 PTS</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    REPLAY
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVictoryModal(false);
                      setShowExplanationModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-white">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Rate Law, Reaction Order &amp; Half-Life Guide
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                    Module 05: Chemical Kinetics • Rate Laws &amp; Decay Kinetics
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExplanationModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Explanation Content */}
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 space-y-6 text-slate-700 leading-relaxed font-sans text-xs sm:text-sm">
                {/* 1. The Big Everyday Question */}
                <div className="space-y-3 bg-sky-50/70 p-4 rounded-2xl border border-sky-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                    PART 1: THE BIG EVERYDAY QUESTION
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    &ldquo;How Fast Do Things Disappear?&rdquo;
                  </h3>
                  <p className="text-slate-600">
                    When you take medicine (like a headache pill), it doesn&apos;t stay in your body forever, nor does it vanish all at once in one second.
                  </p>
                  <p className="text-slate-600">
                    Instead, your body slowly breaks it down over time.
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-sky-200/80 text-xs sm:text-sm text-slate-700 space-y-1.5">
                    <p className="font-semibold text-slate-900">But how does it break down?</p>
                    <p className="text-slate-600">
                      Does it lose 10 mg every hour steadily like a leaking bucket? <strong>No!</strong>
                    </p>
                    <p className="text-[#0284C7] font-bold">
                      It decreases by percentage (by halves).
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    This brings us to the core concept: <strong>Half-Life (t₁/₂)</strong>.
                  </p>
                </div>

                {/* 2. What Is Half-Life in Simple Words? */}
                <div className="space-y-3 border-l-4 border-emerald-500 pl-3.5 sm:pl-4 py-1">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    2. What Is Half-Life in Simple Words?
                  </h4>
                  <p className="text-slate-700 font-medium">
                    <strong>Half-Life</strong> is the time it takes for exactly <strong>HALF (50%)</strong> of what you started with to disappear.
                  </p>
                  <p className="text-slate-600">
                    Imagine you have <strong>40 marbles</strong> in a box:
                  </p>
                  <p className="text-slate-600">
                    You set a timer. Every <strong>10 seconds</strong>, half of whatever is inside turns into dust:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 font-mono text-xs text-slate-800 space-y-1">
                    <div>• <strong>At 0 seconds (Start):</strong> You have 40 marbles (100%).</div>
                    <div>• <strong>After 10 seconds (1st Half-Life):</strong> Half disappear → <strong>20 marbles remain (50%)</strong>.</div>
                    <div>• <strong>After 20 seconds (2nd Half-Life):</strong> Half of what was left disappears → <strong>10 marbles remain (25%)</strong>.</div>
                    <div>• <strong>After 30 seconds (3rd Half-Life):</strong> Half again → <strong>5 marbles remain (12.5%)</strong>.</div>
                  </div>
                  <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1">
                    <div className="font-bold text-emerald-800">Notice something very interesting:</div>
                    <div>• It does <strong>not</strong> reach 0 after 20 seconds!</div>
                    <div>• Each half-life cuts <strong>whatever is remaining in half</strong>.</div>
                  </div>
                </div>

                {/* 3. The Big Scientific Mystery */}
                <div className="space-y-3 border-l-4 border-indigo-500 pl-3.5 sm:pl-4 py-1">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    3. The Big Scientific Mystery: &ldquo;Why Does It Not Depend on Amount?&rdquo; (First-Order Kinetics)
                  </h4>
                  <p className="text-slate-600">A student might ask:</p>
                  <blockquote className="italic font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    &ldquo;If I start with 1,000,000 molecules instead of 40, won&apos;t it take way longer to reach half?&rdquo;
                  </blockquote>
                  <p className="text-slate-700">
                    The surprising answer in a First-Order reaction is: <strong>NO! It takes the exact same 10 seconds!</strong>
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-mono text-xs text-slate-800 space-y-1">
                    <div className="font-sans font-bold text-slate-700">Whether you start with 100 M or 1.0 M:</div>
                    <div>• 100 M → drops to 50 M in <strong>10 seconds</strong>.</div>
                    <div>• 1.0 M → drops to 0.5 M in <strong>10 seconds</strong>.</div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Why does this happen?</p>
                    <p className="text-slate-600">Because the reaction speed depends directly on the concentration:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs pl-1">
                      <li>When there is <strong>a lot</strong> of reactant, reactions happen <strong>super fast</strong>.</li>
                      <li>When there is <strong>less</strong> reactant, reactions <strong>slow down</strong>.</li>
                    </ul>
                    <p className="text-slate-700 font-semibold text-xs">
                      These two effects balance each other out perfectly so that the time to lose 50% is always constant!
                    </p>
                  </div>

                  <div className="bg-indigo-50/80 rounded-2xl p-3.5 border border-indigo-100 font-mono text-xs text-indigo-950 space-y-1">
                    <div className="font-sans font-bold text-indigo-800 mb-1">Mathematically, scientists write this as:</div>
                    <div className="text-sm font-bold text-indigo-900 bg-white p-2 rounded-xl border border-indigo-200 text-center">
                      t₁/₂ = 0.693 / k
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 font-sans">
                      (Notice: There is no starting amount <strong>[A]₀</strong> in this formula! Only the speed constant <strong>k</strong> matters.)
                    </div>
                  </div>
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

export default RateLawHalfLifeGamePage;
