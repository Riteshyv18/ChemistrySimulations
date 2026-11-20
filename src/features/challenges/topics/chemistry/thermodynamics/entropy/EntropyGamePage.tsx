"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Trophy,
  RotateCcw,
  Play,
  Flame,
  CheckCircle2,
  AlertCircle,
  X,
  Thermometer,
  Gauge,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Layers,
} from "lucide-react";

// ============================================================================
// SIMULATION CONSTANTS & PARTICLE CONFIG
// ============================================================================
const NUM_PARTICLES = 64; // 4x4x4 cube lattice for solid state
const SOLID_LATTICE_SPACING = 0.42;

interface ParticleData {
  id: number;
  latticePos: THREE.Vector3;
  curPos: THREE.Vector3;
  velocity: THREE.Vector3;
}

// ============================================================================
// 3D MOLECULAR CHAMBER PARTICLES SYSTEM
// ============================================================================
function ParticlesChamber({
  temperature,
  phaseState,
}: {
  temperature: number; // 100K to 500K
  phaseState: "solid" | "liquid" | "gas";
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize particles with stable lattice origins and randomized initial velocities
  const particles = useMemo<ParticleData[]>(() => {
    const list: ParticleData[] = [];
    let idx = 0;
    const offset = (3 * SOLID_LATTICE_SPACING) / 2;

    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        for (let z = 0; z < 4; z++) {
          const lPos = new THREE.Vector3(
            x * SOLID_LATTICE_SPACING - offset,
            y * SOLID_LATTICE_SPACING - offset - 0.2,
            z * SOLID_LATTICE_SPACING - offset
          );
          const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5
          );
          list.push({
            id: idx++,
            latticePos: lPos.clone(),
            curPos: lPos.clone(),
            velocity: vel,
          });
        }
      }
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(delta, 0.05);

    // Chamber boundaries
    const boxX = 1.35;
    const boxY = 1.35;
    const boxZ = 1.35;

    // Phase-dependent behavior
    if (phaseState === "solid") {
      // Solid: Vibrates about fixed crystal lattice points with temperature-dependent amplitude
      const jitterFactor = (temperature / 273) * 0.06;
      particles.forEach((p, i) => {
        const vibration = new THREE.Vector3(
          Math.sin(time * 18 + p.id * 1.3) * jitterFactor,
          Math.cos(time * 22 + p.id * 2.1) * jitterFactor,
          Math.sin(time * 20 + p.id * 0.7) * jitterFactor
        );
        p.curPos.copy(p.latticePos).add(vibration);

        dummy.position.copy(p.curPos);
        dummy.scale.setScalar(0.12);
        dummy.updateMatrix();
        meshRef.current?.setMatrixAt(i, dummy.matrix);
      });
    } else if (phaseState === "liquid") {
      // Liquid: Settles at bottom due to gravity, flows and slides with moderate speeds
      const speedScale = 0.8 + (temperature - 273) * 0.005;
      const liquidFloorY = -boxY + 0.15;
      const liquidTopY = 0.2; // constrained liquid height

      particles.forEach((p, i) => {
        // Drift
        p.curPos.addScaledVector(p.velocity, clampedDelta * speedScale);

        // Weak gravity downward towards liquid bed
        p.velocity.y -= clampedDelta * 1.8;

        // Soft boundaries for liquid
        if (p.curPos.x > boxX - 0.1) {
          p.curPos.x = boxX - 0.1;
          p.velocity.x *= -0.7;
        } else if (p.curPos.x < -boxX + 0.1) {
          p.curPos.x = -boxX + 0.1;
          p.velocity.x *= -0.7;
        }

        if (p.curPos.y > liquidTopY) {
          p.curPos.y = liquidTopY;
          p.velocity.y *= -0.4;
        } else if (p.curPos.y < liquidFloorY) {
          p.curPos.y = liquidFloorY;
          p.velocity.y = Math.abs(p.velocity.y) * 0.5 + Math.random() * 0.2;
        }

        if (p.curPos.z > boxZ - 0.1) {
          p.curPos.z = boxZ - 0.1;
          p.velocity.z *= -0.7;
        } else if (p.curPos.z < -boxZ + 0.1) {
          p.curPos.z = -boxZ + 0.1;
          p.velocity.z *= -0.7;
        }

        dummy.position.copy(p.curPos);
        dummy.scale.setScalar(0.115);
        dummy.updateMatrix();
        meshRef.current?.setMatrixAt(i, dummy.matrix);
      });
    } else {
      // Gas: Highly energetic, rapid isotropic bouncing filling the entire 3D volume
      const speedScale = 1.8 + (temperature - 373) * 0.012;

      particles.forEach((p, i) => {
        p.curPos.addScaledVector(p.velocity, clampedDelta * speedScale);

        // Elastic box reflections
        if (Math.abs(p.curPos.x) > boxX) {
          p.curPos.x = Math.sign(p.curPos.x) * boxX;
          p.velocity.x *= -1;
        }
        if (Math.abs(p.curPos.y) > boxY) {
          p.curPos.y = Math.sign(p.curPos.y) * boxY;
          p.velocity.y *= -1;
        }
        if (Math.abs(p.curPos.z) > boxZ) {
          p.curPos.z = Math.sign(p.curPos.z) * boxZ;
          p.velocity.z *= -1;
        }

        dummy.position.copy(p.curPos);
        dummy.scale.setScalar(0.11);
        dummy.updateMatrix();
        meshRef.current?.setMatrixAt(i, dummy.matrix);
      });
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Particle color based on phase
  const particleColor = useMemo(() => {
    if (phaseState === "solid") return "#38BDF8"; // Sky Blue
    if (phaseState === "liquid") return "#0284C7"; // Deep Blue
    return "#F97316"; // Energetic Orange
  }, [phaseState]);

  return (
    <group>
      {/* 3D Glass Chamber Bounding Box */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.9, 2.9, 2.9)]} />
        <lineBasicMaterial color="#94A3B8" transparent opacity={0.4} />
      </lineSegments>

      {/* Chamber Floor Base */}
      <mesh position={[0, -1.46, 0]}>
        <cylinderGeometry args={[1.8, 1.85, 0.12, 32]} />
        <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Instanced Particle Mesh */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, NUM_PARTICLES]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={particleColor}
          roughness={0.25}
          metalness={0.3}
          emissive={particleColor}
          emissiveIntensity={phaseState === "gas" ? 0.35 : 0.15}
        />
      </instancedMesh>
    </group>
  );
}

// ============================================================================
// PHASE DATA AND CHALLENGE CONSTANTS
// ============================================================================
type PhaseKey = "solid" | "liquid" | "gas";

const PHASE_SPECS: Record<
  PhaseKey,
  {
    name: string;
    label: string;
    color: string;
    textColor: string;
    borderColor: string;
    bgPill: string;
    description: string;
    orderIndex: number;
    baseEntropy: number;
  }
> = {
  solid: {
    name: "Solid (Ice)",
    label: "SOLID",
    color: "#0284C7",
    textColor: "text-sky-950 font-black",
    borderColor: "border-sky-400",
    bgPill: "bg-sky-100/90 text-sky-950 border-sky-400 shadow-xs",
    description: "Rigid fixed crystal lattice, ordered arrangement",
    orderIndex: 1,
    baseEntropy: 41.3,
  },
  liquid: {
    name: "Liquid (Water)",
    label: "LIQUID",
    color: "#059669",
    textColor: "text-emerald-950 font-black",
    borderColor: "border-emerald-400",
    bgPill: "bg-emerald-100/90 text-emerald-950 border-emerald-400 shadow-xs",
    description: "Fluid slipping particles, intermediate disorder",
    orderIndex: 2,
    baseEntropy: 69.9,
  },
  gas: {
    name: "Gas (Steam)",
    label: "GAS",
    color: "#D97706",
    textColor: "text-amber-950 font-black",
    borderColor: "border-amber-400",
    bgPill: "bg-amber-100/90 text-amber-950 border-amber-400 shadow-xs",
    description: "Rapid chaotic diffusion, maximum accessible microstates",
    orderIndex: 3,
    baseEntropy: 188.8,
  },
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function EntropyGamePage({
  difficulty = "level1",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Navigation: "mission" -> "instructions" -> "lab"
  const [screenState, setScreenState] = useState<"mission" | "instructions" | "lab">("mission");

  // Temperature control: 100K to 500K (Default: 180K Solid)
  const [temperature, setTemperature] = useState<number>(180);

  // Derive phase from temperature:
  // T < 273K: Solid | 273K <= T < 373K: Liquid | T >= 373K: Gas
  const phaseState: PhaseKey = useMemo(() => {
    if (temperature < 273) return "solid";
    if (temperature < 373) return "liquid";
    return "gas";
  }, [temperature]);

  // Dynamic calculated Entropy S in J/(mol·K)
  const entropyValue = useMemo(() => {
    const base = PHASE_SPECS[phaseState].baseEntropy;
    const tempFactor = (temperature / 100) * 4.2;
    return Number((base + tempFactor).toFixed(1));
  }, [temperature, phaseState]);

  // Challenge ordering slots: student arranges [slot1, slot2, slot3] in increasing entropy
  // Correct ordering: ["solid", "liquid", "gas"]
  const [arrangedSlots, setArrangedSlots] = useState<PhaseKey[]>(["gas", "solid", "liquid"]);

  // Modals
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState<boolean>(false);
  const [incorrectFeedback, setIncorrectFeedback] = useState<string>("");

  // Toast notification
  const [notification, setNotification] = useState<string | null>(null);

  const handleExitClick = () => {
    if (onExit) {
      onExit();
    } else {
      window.history.back();
    }
  };

  // Move slot up or down
  const handleSwapSlot = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= arrangedSlots.length) return;

    const updated = [...arrangedSlots];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setArrangedSlots(updated);
  };

  // Reset challenge
  const handleResetChallenge = () => {
    setArrangedSlots(["gas", "solid", "liquid"]);
    setTemperature(180);
    setShowVictoryModal(false);
    setShowIncorrectModal(false);
  };

  // Submit Answer
  const handleCheckAnswer = () => {
    const isCorrect =
      arrangedSlots[0] === "solid" &&
      arrangedSlots[1] === "liquid" &&
      arrangedSlots[2] === "gas";

    if (isCorrect) {
      setShowVictoryModal(true);
    } else {
      setIncorrectFeedback(
        `Current arrangement is ${arrangedSlots.map((s) => PHASE_SPECS[s].label).join(" < ")}. Remember: Solids have ordered fixed positions (lowest entropy), Liquids flow with higher disorder, and Gases possess maximum randomness and microstates!`
      );
      setShowIncorrectModal(true);
    }
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ─── TOAST NOTIFICATION ─── */}
      {notification && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-slate-700/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none text-center max-w-[90%]">
          {notification}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 1: MISSION SCREEN (LANDSCAPE 956x440)
          ══════════════════════════════════════════════════════════════════ */}
      {screenState === "mission" && (
        <div className="w-full h-full flex flex-col justify-between p-6 sm:p-7 relative bg-white">
          {/* Top Bar with EXIT */}
          <div className="w-full flex items-center justify-start z-10 shrink-0">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Central Mission Statement */}
          <div className="max-w-2xl w-full mx-auto text-center flex flex-col items-center justify-center flex-1 my-auto z-10 px-4 space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              <span className="text-[#0284C7] font-extrabold uppercase">MISSION:</span> Explore how molecular arrangements and temperature affect the entropy of a system!
            </h2>

            <div className="pt-2 flex justify-center w-full">
              <button
                type="button"
                onClick={() => setScreenState("instructions")}
                className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom spacer (matching Chemical Equilibrium) */}
          <div className="h-8 shrink-0" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 2: INSTRUCTIONS SCREEN (LANDSCAPE 956x440)
          ══════════════════════════════════════════════════════════════════ */}
      {screenState === "instructions" && (
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 relative bg-white overflow-hidden">
          {/* Top Bar with EXIT and INSTRUCTIONS TO PLAY badge */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden sm:block" />
              <div className="px-5 py-1.5 rounded-full bg-[#0B132B] text-white text-xs font-black uppercase tracking-wider shadow-md border border-slate-700/50">
                INSTRUCTIONS TO PLAY
              </div>
              <div className="w-12 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden sm:block" />
            </div>

            <div className="w-16" />
          </div>

          {/* 3 Step Guidance Cards */}
          <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 flex-1 my-1">
            <div className="grid grid-cols-3 gap-3.5 w-full items-stretch">
              
              {/* Card 1: 3D Chamber & Particle Motion */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Watch Particle Motion
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-extrabold text-[9px] uppercase tracking-wider">
                      3D MOLECULAR CHAMBER
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-tight mt-1.5">
                    Observe particles in the chamber. Watch their movement and disorder change across Solid, Liquid, and Gas states.
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-950 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/entropy_card1_chamber.png"
                    alt="3D Particle Chamber"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Card 2: Temperature Slider */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Adjust Temperature
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-extrabold text-[9px] uppercase tracking-wider">
                      HEAT SLIDER (100K - 500K)
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-tight mt-1.5">
                    Drag the slider to heat or cool. Increasing temperature makes particles vibrate and move faster, raising entropy!
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/entropy_card2_temp.png"
                    alt="Chamber Temperature Slider"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Card 3: Rank States by Entropy */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Rank Phase Entropy
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider">
                      SOLID &lt; LIQUID &lt; GAS
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-tight mt-1.5">
                    Use the <strong>&lt; MOVE &gt;</strong> buttons to arrange phases from lowest to highest disorder, then tap <strong>CHECK ANSWER</strong>!
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/entropy_card3_rank.png"
                    alt="Rank Increasing Entropy"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Actions */}
          <div className="w-full flex items-center justify-center gap-4 max-w-md mx-auto pt-2 z-10 shrink-0">
            <button
              type="button"
              onClick={() => setScreenState("mission")}
              className="flex items-center gap-1.5 h-9 px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>BACK</span>
            </button>

            <button
              type="button"
              onClick={() => setScreenState("lab")}
              className="flex items-center gap-1.5 h-9 px-7 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PLAY</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 3: INTERACTIVE 3D ENTROPY LAB (FULL WIDTH 3D + BOTTOM SINGLE ROW)
          ══════════════════════════════════════════════════════════════════ */}
      {screenState === "lab" && (
        <div className="w-full h-full flex flex-col justify-between relative bg-white overflow-hidden p-2 sm:p-2.5">
          {/* Top Bar: EXIT & EXPLANATION */}
          <div className="w-full flex items-center justify-between pb-1.5 z-30 shrink-0">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* MAIN 3D VISUAL: Covers full screen width with maximized height */}
          <div className="flex-1 w-full min-h-0 relative rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden flex flex-col">
            {/* Overlay HUD at Top of Chamber */}
            <div className="absolute top-2 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-700/80 shadow-md">
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span className="font-mono font-black text-[11px] text-white">
                  {temperature} K
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-700/80 shadow-md">
                <Gauge className="w-3 h-3 text-sky-400" />
                <span className="font-mono font-black text-[11px] text-sky-300">
                  S = {entropyValue} J/(mol·K)
                </span>
              </div>
            </div>

            {/* 3D WebGL Canvas */}
            <div className="w-full h-full relative">
              <Canvas gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 4.8]} fov={38} />
                <ambientLight intensity={0.8} />
                <directionalLight position={[4, 6, 4]} intensity={1.2} />
                <directionalLight position={[-4, -3, -2]} intensity={0.4} />
                <pointLight position={[0, 0, 2]} intensity={0.5} />

                <Suspense fallback={null}>
                  <ParticlesChamber
                    temperature={temperature}
                    phaseState={phaseState}
                  />
                </Suspense>
              </Canvas>
            </div>
          </div>

          {/* BOTTOM CONTROLS: COMPACT SINGLE ROW */}
          <div className="w-full pt-1.5 flex items-stretch gap-2 shrink-0 z-10">
            {/* 1. Temperature Slider Box (Increased length to 35% width) */}
            <div className="w-[35%] bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-[10px] text-slate-900 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  CHAMBER TEMP
                </span>
                <span className="font-mono font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-300 shadow-2xs">
                  {temperature} K
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="100"
                max="500"
                step="5"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284C7] my-1"
              />

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-900 font-extrabold">
                <span>100K</span>
                <span>273K</span>
                <span>373K</span>
                <span>500K</span>
              </div>
            </div>

            {/* 2. Rank Increasing Entropy Box (flex-1) */}
            <div className="flex-1 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between pb-0.5 border-b border-slate-100">
                <span className="font-black text-[10px] text-slate-900 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#0284C7]" />
                  RANK INCREASING ENTROPY
                </span>
                <button
                  type="button"
                  onClick={handleResetChallenge}
                  className="flex items-center gap-0.5 text-[8.5px] text-slate-600 hover:text-slate-900 font-extrabold cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>RESET</span>
                </button>
              </div>

              {/* 3 State Slots with Arrows */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 my-auto">
                {arrangedSlots.map((phaseKey, idx) => {
                  const spec = PHASE_SPECS[phaseKey];
                  return (
                    <div
                      key={phaseKey}
                      className={`px-2 py-1.5 rounded-lg border flex items-center justify-between gap-1 transition-all ${spec.bgPill}`}
                    >
                      <span className={`font-black text-xs uppercase tracking-wider whitespace-nowrap ${spec.textColor}`}>
                        {spec.label}
                      </span>

                      {/* Swap Buttons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleSwapSlot(idx, "left")}
                          className="p-1 rounded bg-white hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs border border-slate-300"
                          title="Move left"
                        >
                          <ChevronLeft className="w-2.5 h-2.5 text-slate-800" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arrangedSlots.length - 1}
                          onClick={() => handleSwapSlot(idx, "right")}
                          className="p-1 rounded bg-white hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs border border-slate-300"
                          title="Move right"
                        >
                          <ChevronRight className="w-2.5 h-2.5 text-slate-800" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Check Answer Button (Reduced button size, fully visible text) */}
            <div className="w-32 sm:w-36 flex items-center shrink-0">
              <button
                type="button"
                onClick={handleCheckAnswer}
                className="w-full h-full py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-normal shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="whitespace-nowrap">CHECK ANSWER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VICTORY MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showVictoryModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 text-center shadow-2xl border border-emerald-100 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3 text-emerald-600 shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider mb-2 border border-emerald-200/60">
              ENTROPY PRINCIPLE VERIFIED
            </span>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              Phase Disorder Mastered!
            </h3>

            <p className="text-slate-600 text-xs font-medium leading-relaxed mb-5">
              You correctly identified that entropy increases as states transition from fixed crystal solids to mobile liquids, reaching maximum disorder and microstates in gases:
              <br />
              <strong className="text-emerald-700 font-mono mt-1 block">
                S(Solid) &lt; S(Liquid) &lt; S(Gas)
              </strong>
            </p>

            <div className="w-full grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleResetChallenge}
                className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVictoryModal(false);
                  setShowExplanationModal(true);
                }}
                className="w-full py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 fill-current" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          INCORRECT MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showIncorrectModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 text-center shadow-2xl border border-rose-100 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-3 text-rose-600 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider mb-2 border border-rose-200/60">
              INCORRECT ORDERING
            </span>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              Check Phase Disorder
            </h3>

            <p className="text-slate-600 text-xs font-medium leading-relaxed mb-5">
              {incorrectFeedback}
            </p>

            <div className="w-full grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowIncorrectModal(false)}
                className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>TRY AGAIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowIncorrectModal(false);
                  setShowExplanationModal(true);
                }}
                className="w-full py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 fill-current" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EXPLANATION MODAL (EDITORIAL STYLE WITHOUT CLUTTER)
          ══════════════════════════════════════════════════════════════════ */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="w-full flex items-center justify-between px-6 py-3.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 tracking-tight">
                  Entropy &amp; Molecular Disorder
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Topic Guide &amp; Physical Concepts
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Editorial Content */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-5 space-y-6 text-slate-700 text-sm leading-relaxed w-full">
            {/* CONCEPT 1: What is Entropy? */}
            <section className="space-y-2">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Concept 1: What is Entropy? (The Messy Room Analogy)
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Think of your room: there is only <strong>one way</strong> for it to be completely tidy (every item in its exact place), but there are <strong>millions of different ways</strong> for it to be messy!
              </p>
              <p className="text-slate-600 leading-relaxed">
                In chemistry, <strong>Entropy (S)</strong> measures the number of accessible microscopic arrangements (disorder or randomness) of particles in a system:
              </p>
              <p className="font-bold text-slate-900 pl-3 border-l-2 border-sky-500 py-1">
                &ldquo;More accessible arrangements and freedom of motion = Higher Entropy (S)!&rdquo;
              </p>
            </section>

            {/* CONCEPT 2: Comparing Phases */}
            <section className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Concept 2: Comparing Solid, Liquid, and Gas
              </h4>
              <div className="space-y-3 pt-1 pl-1">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                    1. Solid (Lowest Entropy &bull; S &asymp; 41 J/mol&bull;K)
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Particles are locked in fixed positions inside a rigid crystal lattice. They only vibrate in place, giving the lowest possible microstates.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                    2. Liquid (Intermediate Entropy &bull; S &asymp; 70 J/mol&bull;K)
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Particles slip and slide past each other while staying close together. Freedom of movement increases, so entropy rises.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                    3. Gas (Highest Entropy &bull; S &asymp; 189 J/mol&bull;K)
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Particles fly freely and randomly at high speeds throughout the entire chamber volume, producing maximum disorder and microstates!
                  </p>
                </div>
              </div>

              <div className="py-2.5 text-center font-mono font-black text-base text-slate-900 border-y border-slate-100">
                S<sub>solid</sub> &lt; S<sub>liquid</sub> &lt; S<sub>gas</sub>
              </div>
            </section>

            {/* CONCEPT 3: Direction of Entropy Change */}
            <section className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Concept 3: Physical Changes &amp; &Delta;S Sign
              </h4>
              <p className="text-slate-600 leading-relaxed">
                When a physical process creates more particle freedom, the change in entropy is positive (&Delta;S &gt; 0):
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 pl-2">
                <li><strong>Melting (Solid ➔ Liquid):</strong> &Delta;S &gt; 0 (Disorder increases)</li>
                <li><strong>Boiling / Vaporization (Liquid ➔ Gas):</strong> &Delta;S &gt; 0 (Huge entropy increase!)</li>
                <li><strong>Freezing (Liquid ➔ Solid):</strong> &Delta;S &lt; 0 (Order increases, entropy decreases)</li>
              </ul>
            </section>

            {/* HOW TO PLAY AND WIN */}
            <section className="space-y-2 border-t border-slate-100 pt-4 pb-2">
              <h4 className="text-base font-black text-[#0284C7] tracking-tight">
                How to Play &amp; Win
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-1">
                <li>
                  <strong className="text-slate-800">Explore Temperature:</strong> Drag the slider from 100K to 500K to watch ice melt and steam boil in the 3D chamber.
                </li>
                <li>
                  <strong className="text-slate-800">Observe Entropy:</strong> Look at the top HUD &mdash; notice how S jumps across phase transitions.
                </li>
                <li>
                  <strong className="text-slate-800">Order Phases:</strong> Use the left/right arrows on the cards so they read <strong>SOLID &lt; LIQUID &lt; GAS</strong>.
                </li>
                <li>
                  <strong className="text-slate-800">Check Answer:</strong> Click <strong>CHECK ANSWER</strong> to verify and complete the challenge!
                </li>
              </ol>
            </section>
          </div>

          {/* Footer with Left 'N' and Centered RESUME CHALLENGE Button */}
          <div className="w-full px-6 py-3 border-t border-slate-100 flex items-center justify-center relative shrink-0 bg-white">
            <div className="absolute left-6 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-md">
              N
            </div>

            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="px-8 py-2 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

