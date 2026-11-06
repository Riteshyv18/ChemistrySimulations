"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  Trophy,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Pause,
  Check,
  Target,
  Zap,
  Clock,
  Sparkles,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ── FARADAY CONSTANTS & FORMULAS ─────────────────────────────────────────────
const MOLAR_MASS_CU = 63.5; // g/mol
const FARADAY_CONST = 96500; // C/mol
const ION_CHARGE_N = 2; // Cu2+ requires 2 electrons
const TARGET_MASS = 0.635; // Target deposit mass (g)
const TARGET_CURRENT = 1.0; // 1.0 A
const TARGET_TIME = 1930; // 1930 s (32m 10s)

// Audio synthesizers for immersive tactile feedback
function playAudioTone(type: "click" | "correct" | "wrong" | "win" | "hum") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === "hum") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // Ignore audio errors
  }
}

// ── 3D BEAKER & ELECTROLYTE SOLUTION ─────────────────────────────────────────
function Beaker3D() {
  return (
    <group position={[-1.2, 0, 0]}>
      {/* Outer Glass Wall */}
      <mesh position={[0, 1.25, 0]} renderOrder={2}>
        <cylinderGeometry args={[1.35, 1.3, 2.6, 36, 1, true]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent
          opacity={0.22}
          roughness={0.05}
          metalness={0.05}
          transmission={0.92}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Beaker Glass Base */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 36]} />
        <meshStandardMaterial color="#CBD5E1" transparent opacity={0.5} roughness={0.1} />
      </mesh>

      {/* Glass Rim Top Ring */}
      <mesh position={[0, 2.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.04, 16, 36]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.1} />
      </mesh>

      {/* Aqueous CuSO4 Electrolyte Volume (Vibrant transparent blue) */}
      <mesh position={[0, 1.05, 0]} renderOrder={1}>
        <cylinderGeometry args={[1.3, 1.26, 2.05, 36]} />
        <meshStandardMaterial
          color="#0284C7"
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Meniscus Top Surface */}
      <mesh position={[0, 2.07, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[1.3, 36]} />
        <meshStandardMaterial
          color="#0284C7"
          roughness={0.15}
          metalness={0.15}
          transparent
          opacity={0.94}
        />
      </mesh>

      {/* Volume Measurement Lines on Beaker */}
      {[-0.4, -0.1, 0.2, 0.5].map((yOff, idx) => (
        <mesh key={idx} position={[1.32, 1.1 + yOff, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.18, 8]} />
          <meshBasicMaterial color="#BAE6FD" />
        </mesh>
      ))}

      {/* Label under Beaker */}
      <Html position={[0, -0.22, 1.0]} center distanceFactor={8.5} zIndexRange={[10, 0]}>
        <div className="bg-slate-900/85 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-700/60 text-slate-100 font-mono text-[10px] font-bold shadow-md pointer-events-none whitespace-nowrap flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block bg-[#0284C7] shadow-sm" />
          <span>CuSO₄ (aq) Electrolyte</span>
        </div>
      </Html>
    </group>
  );
}

// ── 3D ELECTRODES WITH COPPER DEPOSITION ANIMATION ────────────────────────────
function Electrodes3D({
  depositedMass,
  isActive,
  anodeConnected,
  cathodeConnected,
  onConnectAnode,
  onConnectCathode,
}: {
  depositedMass: number;
  isActive: boolean;
  anodeConnected: boolean;
  cathodeConnected: boolean;
  onConnectAnode: () => void;
  onConnectCathode: () => void;
}) {
  // Cathode copper deposit thickness grows with depositedMass
  // Submerged portion is from y=0.3 to y=1.9
  const depositRatio = Math.min(1.0, depositedMass / TARGET_MASS);
  const extraThickness = 0.02 + depositRatio * 0.065;

  return (
    <group position={[-1.2, 0, 0]}>
      {/* ── ANODE (+) [LEFT COPPER STRIP] ── */}
      <group position={[-0.65, 1.45, 0]}>
        {/* Copper Metal Strip */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.26, 2.4, 0.06]} />
          <meshStandardMaterial
            color="#D97706"
            roughness={0.3}
            metalness={0.85}
          />
        </mesh>

        {/* Electrode Clamp on Top Rim */}
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[0.34, 0.18, 0.16]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>

        {/* Terminal Connection Socket */}
        <mesh
          position={[0, 1.35, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onConnectAnode();
          }}
        >
          <cylinderGeometry args={[0.07, 0.07, 0.16, 16]} />
          <meshStandardMaterial
            color={anodeConnected ? "#DC2626" : "#EF4444"}
            emissive={anodeConnected ? "#DC2626" : "#7F1D1D"}
            emissiveIntensity={anodeConnected ? 0.6 : 0.2}
          />
        </mesh>

        {/* Label Tag */}
        <Html position={[0, 0.45, 0.2]} center distanceFactor={8} zIndexRange={[12, 0]}>
          <button
            type="button"
            onClick={onConnectAnode}
            className={`px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-bold border shadow-sm transition-all cursor-pointer flex items-center gap-1 ${anodeConnected
                ? "bg-red-950/90 border-red-500 text-red-200 ring-2 ring-red-400"
                : "bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>ANODE (+) [Cu]</span>
          </button>
        </Html>
      </group>

      {/* ── CATHODE (-) [RIGHT COPPER / OBJECT STRIP] ── */}
      <group position={[0.65, 1.45, 0]}>
        {/* Core Metal Electrode Strip */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.24, 2.4, 0.06]} />
          <meshStandardMaterial
            color="#94A3B8"
            roughness={0.35}
            metalness={0.7}
          />
        </mesh>

        {/* Deposited Copper Layer (Submerged portion) */}
        {depositRatio > 0 && (
          <mesh position={[0, -0.22, 0]}>
            <boxGeometry args={[0.24 + extraThickness, 1.8, 0.06 + extraThickness]} />
            <meshStandardMaterial
              color="#EA580C"
              roughness={0.4}
              metalness={0.8}
            />
          </mesh>
        )}

        {/* Electrode Clamp on Top Rim */}
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[0.34, 0.18, 0.16]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>

        {/* Terminal Connection Socket */}
        <mesh
          position={[0, 1.35, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onConnectCathode();
          }}
        >
          <cylinderGeometry args={[0.07, 0.07, 0.16, 16]} />
          <meshStandardMaterial
            color={cathodeConnected ? "#2563EB" : "#3B82F6"}
            emissive={cathodeConnected ? "#2563EB" : "#1E3A8A"}
            emissiveIntensity={cathodeConnected ? 0.6 : 0.2}
          />
        </mesh>

        {/* Label Tag */}
        <Html position={[0, 0.45, 0.2]} center distanceFactor={8} zIndexRange={[12, 0]}>
          <button
            type="button"
            onClick={onConnectCathode}
            className={`px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-bold border shadow-sm transition-all cursor-pointer flex items-center gap-1 ${cathodeConnected
                ? "bg-blue-950/90 border-blue-500 text-blue-200 ring-2 ring-blue-400"
                : "bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>CATHODE (-)</span>
          </button>
        </Html>
      </group>
    </group>
  );
}

// ── 3D COPPER ION PARTICLES (MIGRATING FROM ANODE TO CATHODE) ────────────────
function CopperIons3D({ isActive }: { isActive: boolean }) {
  const ionCount = 20;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const instMeshRef = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    if (!instMeshRef.current || !isActive) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < ionCount; i++) {
      const progress = (t * 0.45 + i / ionCount) % 1.0;
      // Interpolate from Anode (x=-1.85) to Cathode (x=-0.55)
      const x = -1.85 + progress * 1.3;
      const y = 0.5 + Math.sin(i * 1.7 + t * 2) * 0.45;
      const z = Math.cos(i * 2.3 + t * 2) * 0.45;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.045 + Math.sin(t * 6 + i) * 0.01);
      dummy.updateMatrix();
      instMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    instMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!isActive) return null;

  return (
    <instancedMesh ref={instMeshRef} args={[undefined, undefined, ionCount]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color="#38BDF8" toneMapped={false} />
    </instancedMesh>
  );
}

// ── 3D DC POWER SUPPLY BENCHTOP UNIT ─────────────────────────────────────────
function PowerSupply3D({
  currentAmps,
  isActive,
  onConnectPositive,
  onConnectNegative,
}: {
  currentAmps: number;
  isActive: boolean;
  onConnectPositive: () => void;
  onConnectNegative: () => void;
}) {
  return (
    <group position={[1.8, 1.25, 0]}>
      {/* Power Supply Main Housing Case */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.8, 1.6, 1.2]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Front Face Plate */}
      <mesh position={[0, 0, 0.61]}>
        <planeGeometry args={[1.72, 1.52]} />
        <meshStandardMaterial color="#0F172A" roughness={0.4} />
      </mesh>

      {/* Digital Voltage Display */}
      <mesh position={[-0.42, 0.42, 0.62]}>
        <planeGeometry args={[0.68, 0.35]} />
        <meshBasicMaterial color="#022C22" />
      </mesh>
      <Html position={[-0.42, 0.42, 0.64]} center distanceFactor={7.5} zIndexRange={[12, 0]}>
        <div className="font-mono text-xs font-black text-emerald-400 select-none pointer-events-none drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]">
          {isActive ? (currentAmps * 3.2).toFixed(1) : "0.0"}
          <span className="text-[9px] text-emerald-500 ml-0.5">V</span>
        </div>
      </Html>

      {/* Digital Current (Ammeter) Display */}
      <mesh position={[0.42, 0.42, 0.62]}>
        <planeGeometry args={[0.68, 0.35]} />
        <meshBasicMaterial color="#022C22" />
      </mesh>
      <Html position={[0.42, 0.42, 0.64]} center distanceFactor={7.5} zIndexRange={[12, 0]}>
        <div className="font-mono text-xs font-black text-amber-400 select-none pointer-events-none drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]">
          {isActive ? currentAmps.toFixed(2) : "0.00"}
          <span className="text-[9px] text-amber-500 ml-0.5">A</span>
        </div>
      </Html>

      {/* Control Knobs */}
      <mesh position={[-0.35, -0.05, 0.64]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.08, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.3} />
      </mesh>
      <mesh position={[0.35, -0.05, 0.64]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.08, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.3} />
      </mesh>

      {/* Positive Output Terminal (+) RED */}
      <mesh
        position={[-0.45, -0.45, 0.64]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onConnectPositive();
        }}
      >
        <cylinderGeometry args={[0.075, 0.075, 0.12, 16]} />
        <meshStandardMaterial color="#DC2626" roughness={0.2} />
      </mesh>

      {/* Negative Output Terminal (-) BLUE */}
      <mesh
        position={[0.45, -0.45, 0.64]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onConnectNegative();
        }}
      >
        <cylinderGeometry args={[0.075, 0.075, 0.12, 16]} />
        <meshStandardMaterial color="#2563EB" roughness={0.2} />
      </mesh>

      {/* Power Indicator LED */}
      <mesh position={[0, -0.45, 0.63]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={isActive ? "#22C55E" : "#64748B"} />
      </mesh>

      {/* Unit Banner Label */}
      <Html position={[0, -0.75, 0.6]} center distanceFactor={8} zIndexRange={[10, 0]}>
        <div className="bg-slate-900/90 text-white font-mono text-[9px] font-extrabold px-2 py-0.5 rounded border border-slate-700 shadow-sm pointer-events-none whitespace-nowrap">
          DC POWER SUPPLY
        </div>
      </Html>
    </group>
  );
}

// ── 3D WIRES CONNECTING POWER SUPPLY TO ELECTRODES ────────────────────────────
function ConnectingWires3D({
  anodeConnected,
  cathodeConnected,
  isActive,
}: {
  anodeConnected: boolean;
  cathodeConnected: boolean;
  isActive: boolean;
}) {
  // Red Positive Wire: from Power Supply Positive (1.35, 0.8, 0.64) to Anode (-1.85, 2.8, 0)
  const curveRed = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(1.35, 0.8, 0.64),
        new THREE.Vector3(1.0, 0.3, 0.8),
        new THREE.Vector3(-0.2, 0.15, 0.9),
        new THREE.Vector3(-1.6, 0.5, 0.7),
        new THREE.Vector3(-2.2, 1.8, 0.3),
        new THREE.Vector3(-1.85, 2.8, 0),
      ],
      false,
      "catmullrom",
      0.3
    );
  }, []);

  // Blue Negative Wire: from Power Supply Negative (2.25, 0.8, 0.64) to Cathode (-0.55, 2.8, 0)
  const curveBlue = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(2.25, 0.8, 0.64),
        new THREE.Vector3(2.5, 0.4, 0.8),
        new THREE.Vector3(1.5, 0.2, 0.9),
        new THREE.Vector3(0.5, 0.6, 0.8),
        new THREE.Vector3(-0.2, 1.9, 0.4),
        new THREE.Vector3(-0.55, 2.8, 0),
      ],
      false,
      "catmullrom",
      0.3
    );
  }, []);

  const tubeGeoRed = useMemo(() => new THREE.TubeGeometry(curveRed, 40, 0.032, 10, false), [curveRed]);
  const tubeGeoBlue = useMemo(() => new THREE.TubeGeometry(curveBlue, 40, 0.032, 10, false), [curveBlue]);

  return (
    <group>
      {anodeConnected && (
        <mesh geometry={tubeGeoRed}>
          <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {cathodeConnected && (
        <mesh geometry={tubeGeoBlue}>
          <meshStandardMaterial color="#2563EB" roughness={0.3} metalness={0.1} />
        </mesh>
      )}
    </group>
  );
}

// ── MAIN EXPORT COMPONENT ────────────────────────────────────────────────────
export default function ElectrolysisLevel1GamePage({
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Navigation & Intro Flow
  const [introStep, setIntroStep] = useState<"mission" | "instructions">("mission");
  const [gameStarted, setGameStarted] = useState(false);

  // Simulation State
  const [anodeConnected, setAnodeConnected] = useState(false);
  const [cathodeConnected, setCathodeConnected] = useState(false);
  const [currentAmps, setCurrentAmps] = useState(1.0); // Default 1.0 A
  const [targetSimSeconds, setTargetSimSeconds] = useState(1930); // Target: 1930 s
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(50); // Fast-forward multiplier (1x, 10x, 50x, 100x)

  // Feedback & Victory States
  const [score, setScore] = useState(0);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Live Deposited Mass (Faraday's First Law: m = (M * I * t) / (n * F))
  const depositedMass = useMemo(() => {
    const raw = (MOLAR_MASS_CU * currentAmps * elapsedSeconds) / (ION_CHARGE_N * FARADAY_CONST);
    return Math.min(TARGET_MASS * 1.5, Number(raw.toFixed(3)));
  }, [currentAmps, elapsedSeconds]);

  // Simulation Clock Engine
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      if (isSimRunning && anodeConnected && cathodeConnected) {
        setElapsedSeconds((prev) => {
          const next = prev + deltaSec * simSpeed;
          if (next >= targetSimSeconds) {
            setIsSimRunning(false);
            return targetSimSeconds;
          }
          return next;
        });
      }
      animId = requestAnimationFrame(tick);
    };

    if (isSimRunning) {
      animId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animId);
  }, [isSimRunning, anodeConnected, cathodeConnected, targetSimSeconds, simSpeed]);

  // Handle Play/Pause
  const handleToggleSimulation = () => {
    if (!anodeConnected || !cathodeConnected) {
      playAudioTone("wrong");
      setFeedbackError("Complete the circuit! Connect Anode (+) to red terminal and Cathode (-) to blue terminal.");
      setTimeout(() => setFeedbackError(null), 3000);
      return;
    }

    if (elapsedSeconds >= targetSimSeconds) {
      // Restart if reached target
      setElapsedSeconds(0);
    }

    setIsSimRunning((prev) => {
      const next = !prev;
      playAudioTone(next ? "click" : "hum");
      return next;
    });
  };

  // Submit Mass Check
  const handleSubmitMass = () => {
    if (Math.abs(depositedMass - TARGET_MASS) <= 0.005) {
      setScore(100);
      playAudioTone("win");
      setFeedbackSuccess("🎯 TARGET ACHIEVED! Exactly 0.635 g of copper deposited onto cathode!");
      setTimeout(() => {
        setFeedbackSuccess(null);
        setShowVictoryModal(true);
      }, 1200);
    } else {
      playAudioTone("wrong");
      setFeedbackError(
        `Current Mass: ${depositedMass.toFixed(3)} g (Target is 0.635 g). Adjust Current or Time to hit 0.635 g!`
      );
      setTimeout(() => setFeedbackError(null), 3500);
    }
  };

  // Reset Simulation
  const handleResetChallenge = () => {
    setIsSimRunning(false);
    setElapsedSeconds(0);
    setCurrentAmps(1.0);
    setTargetSimSeconds(1930);
    setScore(0);
    setShowVictoryModal(false);
    setFeedbackError(null);
    setFeedbackSuccess(null);
    playAudioTone("click");
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 0: MISSION INTRO POPUP SCREEN
          ══════════════════════════════════════════════════════════════════════ */}
      {!gameStarted && introStep === "mission" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
          {/* Top Bar: Exit Button */}
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

          <div className="max-w-2xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              <span className="text-[#0284C7]">MISSION:</span> Control current and time to deposit exactly 0.635 g of copper onto the cathode!
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
            SCREEN 1: INSTRUCTIONS SCREEN (3 CARDS WITH STEP GUIDANCE)
            ══════════════════════════════════════════════════════════════════════ */}
      {!gameStarted && introStep === "instructions" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between pt-3 sm:pt-4 px-3 sm:px-5 pb-0 bg-gradient-to-b from-sky-50 via-white to-sky-100 overflow-hidden rounded-3xl sm:rounded-[32px] select-none">
          
          {/* Subtle Science Molecule Backdrop Accents (Top Right & Bottom Left) */}
          <div className="absolute top-3 right-6 pointer-events-none opacity-30 hidden sm:block">
            <svg width="130" height="95" viewBox="0 0 120 90" fill="none" stroke="#0284C7" strokeWidth="1.5">
              <circle cx="20" cy="25" r="5" fill="#38BDF8" />
              <circle cx="60" cy="15" r="6" fill="#38BDF8" />
              <circle cx="100" cy="35" r="5" fill="#38BDF8" />
              <circle cx="75" cy="65" r="6" fill="#38BDF8" />
              <circle cx="35" cy="70" r="5" fill="#38BDF8" />
              <line x1="25" y1="23" x2="54" y2="16" />
              <line x1="66" y1="17" x2="95" y2="33" />
              <line x1="97" y1="39" x2="79" y2="61" />
              <line x1="70" y1="66" x2="40" y2="70" />
              <line x1="32" y1="66" x2="22" y2="30" />
            </svg>
          </div>
          <div className="absolute bottom-4 left-6 pointer-events-none opacity-25 hidden sm:block">
            <svg width="120" height="90" viewBox="0 0 100 80" fill="none" stroke="#0284C7" strokeWidth="1.5">
              <circle cx="20" cy="40" r="6" fill="#38BDF8" />
              <circle cx="50" cy="20" r="5" fill="#38BDF8" />
              <circle cx="80" cy="45" r="6" fill="#38BDF8" />
              <circle cx="50" cy="65" r="5" fill="#38BDF8" />
              <line x1="25" y1="37" x2="45" y2="23" />
              <line x1="55" y1="23" x2="75" y2="42" />
              <line x1="76" y1="48" x2="55" y2="62" />
              <line x1="45" y1="62" x2="25" y2="43" />
            </svg>
          </div>

          {/* Bottom Aesthetic Wave (covers the bottom edge seamlessly) */}
          <div className="absolute bottom-0 inset-x-0 h-32 sm:h-44 pointer-events-none opacity-30 z-0">
            <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path
                d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"
                fill="#7DD3FC"
              />
            </svg>
          </div>

          {/* Top Bar: Exit Button & Styled Pill Header */}
          <div className="w-full flex items-center justify-between z-10 shrink-0 relative">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-4 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Cyan Accent Bar Under Top Header */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
              <div className="px-5 py-1 rounded-full bg-[#0F172A] border border-sky-500/30 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                <span>INSTRUCTIONS TO PLAY</span>
              </div>
              <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
            </div>

            <div className="w-16" />
          </div>

          {/* Main Centered 3 Cards Section - shifted downwards */}
          <div className="max-w-5xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1 translate-y-4 sm:translate-y-7">
            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-3 sm:gap-5 w-full items-stretch">
              {/* Card 1: Connect Terminals */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Connect Terminals
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-extrabold text-[9px] sm:text-[10px]">
                      Circuit Setup
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Click the electrode terminals to connect the positive wire to the Anode and negative wire to the Cathode.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center mt-2.5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/instructions/electrolysis_step1_circuit.png"
                    alt="Connect Terminals"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>

              {/* Card 2: Set Current & Time */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Set Current &amp; Time
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px] sm:text-[10px]">
                      Faraday Controls
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Adjust the current slider and select duration using the control dock, then start the electrolysis.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center mt-2.5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/instructions/electrolysis_step2_controls.png"
                    alt="Set Current and Time"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>

              {/* Card 3: Reach Target Mass */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Reach Target Mass
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[9px] sm:text-[10px]">
                      Deposit &amp; Submit
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Watch the copper deposit onto the cathode until the deposited mass reaches the required target, then submit.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center mt-2.5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/instructions/electrolysis_step3_target.png"
                    alt="Reach Target Mass"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modern Pill BACK and PLAY Buttons Styled like Image */}
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

      {/* ── TOP HEADER BUTTONS: EXIT (Left) & EXPLANATION (Right) ─────────── */}
      {gameStarted && (
        <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-3 pb-1 z-30 shrink-0">
          {/* Top-Left Exit Button */}
          <button
            type="button"
            onClick={() => (onExit ? onExit() : exitSimulation())}
            className="flex items-center gap-1.5 h-8 px-4 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-md transition-all cursor-pointer active:scale-95"
            title="Exit Simulation"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>EXIT</span>
          </button>

          {/* Top-Right Explanation Button */}
          <button
            type="button"
            onClick={() => setShowExplanationModal(true)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
            title="Explanation Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-200" />
            <span>EXPLANATION</span>
          </button>
        </div>
      )}

      {/* ── FEEDBACK ALERTS ─────────────────────────────────────────────────── */}
      {gameStarted && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-lg px-4 flex flex-col items-center">
          {feedbackError && (
            <div className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-red-400 flex items-center gap-2 pointer-events-auto animate-bounce">
              <span>⚠️</span>
              <span>{feedbackError}</span>
            </div>
          )}
          {feedbackSuccess && (
            <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-emerald-400 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-200">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{feedbackSuccess}</span>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
            MAIN SIMULATION CANVAS & INTERACTIVE APPARATUS
            ══════════════════════════════════════════════════════════════════════ */}
      {gameStarted && (
        <div className="flex-1 w-full relative flex flex-col overflow-hidden">
          {/* 3D WebGL Canvas for Electrolysis Lab */}
          <div className="absolute inset-0 w-full h-full">
            <Canvas
              camera={{ position: [0, 2.5, 9.4], fov: 38 }}
              gl={{ antialias: true, alpha: false }}
              className="w-full h-full touch-none"
            >
              <color attach="background" args={["#F8FAFC"]} />
              <ambientLight intensity={1.5} />
              <directionalLight position={[6, 9, 6]} intensity={1.4} castShadow />
              <directionalLight position={[-6, -4, -4]} intensity={0.5} />

              {/* Lab Bench Surface */}
              <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 12]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.05} />
              </mesh>
              <gridHelper args={[20, 40, "#E2E8F0", "#F1F5F9"]} position={[0, -0.04, 0]} />

              {/* 3D Glass Beaker with CuSO4 Solution */}
              <Beaker3D />

              {/* Anode & Cathode Electrodes with live Copper Growth */}
              <Electrodes3D
                depositedMass={depositedMass}
                isActive={isSimRunning}
                anodeConnected={anodeConnected}
                cathodeConnected={cathodeConnected}
                onConnectAnode={() => {
                  setAnodeConnected((prev) => !prev);
                  playAudioTone("click");
                }}
                onConnectCathode={() => {
                  setCathodeConnected((prev) => !prev);
                  playAudioTone("click");
                }}
              />

              {/* Migrating Cu2+ Ions */}
              <CopperIons3D isActive={isSimRunning} />

              {/* DC Power Supply Box */}
              <PowerSupply3D
                currentAmps={currentAmps}
                isActive={isSimRunning}
                onConnectPositive={() => {
                  setAnodeConnected((prev) => !prev);
                  playAudioTone("click");
                }}
                onConnectNegative={() => {
                  setCathodeConnected((prev) => !prev);
                  playAudioTone("click");
                }}
              />

              {/* Connecting Wires */}
              <ConnectingWires3D
                anodeConnected={anodeConnected}
                cathodeConnected={cathodeConnected}
                isActive={isSimRunning}
              />

              <OrbitControls
                enablePan={false}
                minDistance={5}
                maxDistance={12}
                maxPolarAngle={Math.PI / 2.05}
                minPolarAngle={Math.PI / 4.5}
              />
            </Canvas>
          </div>

          {/* ── TOP-LEFT CIRCUIT STATUS BADGE ─────────────────────────────────── */}
          <div className="absolute top-2 left-4 z-20 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-md flex items-center gap-2 pointer-events-auto">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Circuit:
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${anodeConnected && cathodeConnected
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                  }`}
              >
                {anodeConnected && cathodeConnected ? "CONNECTED" : "DISCONNECTED (CLICK TERMINALS)"}
              </span>
            </div>
          </div>

          {/* ── BOTTOM CENTER DOCK: CONTROLS (CURRENT, TIME, POWER) ──────────── */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl px-5 py-2.5 sm:px-6 sm:py-3 border border-slate-200 shadow-xl pointer-events-auto flex items-center gap-4 sm:gap-6">

              {/* Current Setting Slider */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-extrabold text-slate-700">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>CURRENT (I):</span>
                  <span className="font-mono text-sm sm:text-base font-black text-slate-900 w-14 text-right">
                    {currentAmps.toFixed(2)} A
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  disabled={isSimRunning}
                  value={currentAmps}
                  onChange={(e) => {
                    setCurrentAmps(parseFloat(e.target.value));
                    playAudioTone("click");
                  }}
                  className="w-32 sm:w-36 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                />
              </div>

              <div className="w-[1.5px] h-10 bg-slate-200" />

              {/* Time Setting & Elapsed Timer */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-extrabold text-slate-700">
                  <Clock className="w-4 h-4 text-[#0284C7]" />
                  <span>TIME (t):</span>
                  <span className="font-mono text-sm sm:text-base font-black text-slate-900">
                    {Math.floor(elapsedSeconds / 60)}m {Math.floor(elapsedSeconds % 60)}s
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                    / {Math.floor(targetSimSeconds / 60)}m {Math.floor(targetSimSeconds % 60)}s
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1000, 1930, 2400].map((tVal) => (
                    <button
                      key={tVal}
                      type="button"
                      disabled={isSimRunning}
                      onClick={() => {
                        setTargetSimSeconds(tVal);
                        playAudioTone("click");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs sm:text-[13px] font-mono font-black transition-all cursor-pointer ${targetSimSeconds === tVal
                          ? "bg-[#0284C7] text-white shadow-sm scale-105"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      {Math.floor(tVal / 60)}m {tVal % 60}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-[1.5px] h-10 bg-slate-200" />

              {/* Simulation Speed & Start/Pause Button */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const nextSpeed = simSpeed === 10 ? 50 : simSpeed === 50 ? 100 : 10;
                    setSimSpeed(nextSpeed);
                    playAudioTone("click");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs sm:text-[13px] font-extrabold border border-slate-300 transition-all cursor-pointer"
                  title="Simulation Speed Multiplier"
                >
                  {simSpeed}x SPEED
                </button>

                <button
                  type="button"
                  onClick={handleToggleSimulation}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-white shadow-md transition-all cursor-pointer flex items-center gap-2 transform hover:scale-[1.03] active:scale-95 ${isSimRunning
                      ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                      : "bg-[#0284C7] hover:bg-[#0369A1] shadow-sky-600/30"
                    }`}
                >
                  {isSimRunning ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>START</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL OVERLAY: DEPOSITED MASS + TARGET + SUBMIT (Positioned higher on right) ───────── */}
            <div className="absolute right-3 sm:right-6 top-[34%] -translate-y-1/2 z-20 w-44 sm:w-48 flex flex-col gap-2 pointer-events-none">
              {/* Live Deposited Mass Display */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-md pointer-events-auto flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Deposited Cu Mass:
                </span>
                <span className="font-mono font-black text-lg sm:text-xl text-slate-900 mt-0.5">
                  {depositedMass.toFixed(3)} <span className="text-xs text-slate-500 font-bold">g</span>
                </span>
              </div>

              {/* Target Card */}
              <div
                className={`bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border shadow-md pointer-events-auto flex items-center justify-between transition-all duration-300 ${Math.abs(depositedMass - TARGET_MASS) <= 0.005
                    ? "border-emerald-300 ring-2 ring-emerald-400 bg-emerald-50/90"
                    : "border-slate-200"
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <Target
                    className={`w-4 h-4 ${Math.abs(depositedMass - TARGET_MASS) <= 0.005 ? "text-emerald-600" : "text-slate-400"
                      }`}
                  />
                  <span className="font-extrabold text-[10px] sm:text-[11px] text-slate-600 uppercase tracking-wider">
                    Target:
                  </span>
                </div>
                <span
                  className={`font-mono font-black text-sm sm:text-base transition-colors duration-300 ${Math.abs(depositedMass - TARGET_MASS) <= 0.005
                      ? "text-emerald-600 animate-pulse"
                      : "text-slate-700"
                    }`}
                >
                  {TARGET_MASS.toFixed(3)} g
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitMass}
                className="w-full py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer pointer-events-auto flex items-center justify-center gap-1.5 transform hover:scale-[1.02] active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Submit</span>
              </button>
            </div>
          </div>
        )}

          {/* ── VICTORY MODAL ────────────────────────────────────────────────────── */}
          {showVictoryModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-w-md w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                    <span>EXCELLENT WORK!</span>
                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    You deposited the target mass of copper using electrolysis!
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-2 text-left">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-bold">Deposited Mass (m):</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      {depositedMass.toFixed(3)} g
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-bold">Current (I):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentAmps.toFixed(2)} A
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-bold">Time (t):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {Math.floor(elapsedSeconds / 60)}m {Math.floor(elapsedSeconds % 60)}s ({Math.floor(elapsedSeconds)}s)
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 text-center font-mono text-[11px] text-sky-800">
                    m = (63.5 × 1.0 × 1930) / (2 × 96500) = 0.635 g
                  </div>
                  <div className="flex items-center justify-between text-slate-700 pt-1">
                    <span>Your Total Score:</span>
                    <span className="font-bold text-amber-700 font-mono">{score} / 100 PTS</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetChallenge();
                      setShowVictoryModal(false);
                    }}
                    className="flex-1 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowVictoryModal(false);
                      setShowExplanationModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Explanation</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── EXPLANATION MODAL (Clean 2-Box Format) ─────────────────────────── */}
          {showExplanationModal && (
            <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white/98 backdrop-blur-md animate-in fade-in duration-150 rounded-3xl sm:rounded-[32px]">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-white">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Electrolysis &amp; Faraday&apos;s Laws Guide
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                    Topic 04: Electrochemistry • Quantitative Electrolytic Deposition
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExplanationModal(false)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 space-y-6 text-slate-700 leading-relaxed font-sans text-xs sm:text-sm">
                {/* SECTION 1: What is Electrolysis */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                    <span className="text-[#0284C7]">1.</span> What is Electrolysis?
                  </h3>
                  <p className="text-slate-600">
                    <strong>Electrolysis</strong> is a chemical process where we pass an <strong>electric current</strong> (from a DC battery or power supply) through a liquid solution containing ions (the electrolyte) to drive a chemical reaction.
                  </p>
                  <p className="text-slate-600">
                    <strong>Why do we do this?</strong> In nature, copper dissolved in water won&apos;t turn into solid metal by itself. Electrical energy forces the copper ions to take electrons and turn back into solid pure copper. This is the exact method used in industry for electroplating gold/silver jewelry and purifying copper.
                  </p>
                </div>

                {/* SECTION 2: What Happens at the Two Electrodes */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                    <span className="text-[#0284C7]">2.</span> How Does the Circuit Work? (Anode vs. Cathode)
                  </h3>
                  <p className="text-slate-600">
                    Two copper metal strips are placed inside the blue copper sulfate solution and connected to the power supply:
                  </p>
                  <div className="space-y-2 pl-3 border-l-2 border-slate-200 text-slate-600">
                    <div>
                      <strong className="text-slate-800">Positive Electrode (Anode - Red Wire):</strong> Connected to the positive terminal (+). Copper atoms on this plate lose 2 electrons and dissolve into the solution as blue copper ions:
                      <div className="font-mono text-xs font-bold text-slate-800 my-1">
                        Cu(solid) → Cu²⁺(liquid) + 2 electrons
                      </div>
                    </div>
                    <div>
                      <strong className="text-slate-800">Negative Electrode (Cathode - Blue Wire):</strong> Connected to the negative terminal (-). The power supply pushes electrons to this plate. Positively charged Cu²⁺ ions in the solution are attracted here, pick up 2 electrons, and turn into solid metal:
                      <div className="font-mono text-xs font-bold text-slate-800 my-1">
                        Cu²⁺(liquid) + 2 electrons → Cu(solid metal)
                      </div>
                      This is the new copper layer you see depositing onto the cathode!
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Faraday's First Law of Electrolysis */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                    <span className="text-[#0284C7]">3.</span> Faraday&apos;s First Law (The Core Concept)
                  </h3>
                  <p className="text-slate-600">
                    Scientist Michael Faraday discovered that the <strong>mass of copper deposited is directly proportional to the total amount of electric charge</strong> that flows through the circuit.
                  </p>
                  <p className="text-slate-600">
                    Simply put:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                    <li>Higher Current (I) → More electrons per second → More copper deposited.</li>
                    <li>Longer Time (t) → More time for ions to attach → More copper deposited.</li>
                  </ul>
                </div>

                {/* SECTION 4: The Formula & Step-by-Step Calculation */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                    <span className="text-[#0284C7]">4.</span> The Mathematical Formula
                  </h3>
                  <div className="font-mono font-bold text-sm text-slate-900 bg-slate-50 py-2.5 px-4 rounded-lg border border-slate-200">
                    Mass (m) = (M × I × t) / (n × F)
                  </div>
                  <div className="space-y-1 text-slate-600 text-xs sm:text-[13px] pt-1">
                    <div>• <strong>M (Molar Mass):</strong> 63.5 g/mol (weight of 1 mole of copper atoms)</div>
                    <div>• <strong>I (Current):</strong> Electrical current measured in Amperes (A)</div>
                    <div>• <strong>t (Time):</strong> Duration of the reaction in seconds (s)</div>
                    <div>• <strong>n (Valence):</strong> 2 (because each Cu²⁺ ion requires 2 electrons)</div>
                    <div>• <strong>F (Faraday Constant):</strong> 96,500 Coulombs (the charge of 1 mole of electrons)</div>
                  </div>
                </div>

                {/* SECTION 5: Step-by-Step Example for the Challenge Target */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                    <span className="text-[#0284C7]">5.</span> How to Reach the 0.635 g Target in this Game
                  </h3>
                  <p className="text-slate-600">
                    To reach exactly <strong>0.635 g</strong> of deposited copper:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-2 text-slate-600">
                    <li>Set the current slider to <strong>1.00 A</strong>.</li>
                    <li>Select the duration preset <strong>32m 10s (1930 seconds)</strong>.</li>
                    <li>Calculate the total electrical charge passed: <span className="font-mono">Q = 1.00 A × 1930 s = 1930 Coulombs</span>.</li>
                    <li>Calculate deposited mass: <span className="font-mono">m = (63.5 × 1.00 × 1930) / (2 × 96500) = 122,555 / 193,000 = <strong>0.635 g</strong></span>.</li>
                  </ol>
                  <p className="text-slate-500 text-xs italic pt-1">
                    Once the timer finishes and deposited mass displays 0.635 g, click SUBMIT to complete the challenge!
                  </p>
                </div>
              </div>

              {/* Bottom Bar: RESUME CHALLENGE Button centered */}
              <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-center shrink-0">
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
      );
}
