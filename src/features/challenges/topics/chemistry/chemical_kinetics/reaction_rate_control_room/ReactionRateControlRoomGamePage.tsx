"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import {
  Trophy,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  X,
  Play,
  CheckCircle2,
  Thermometer,
  Gauge,
  Layers,
  Flame,
  Activity,
  Zap,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ============================================================================
// 3D VISUAL ASSETS & RECTANGULAR CHAMBER
// ============================================================================

// Rectangular Reaction Chamber (Identical dimensions & styling to Topic 1)
function RectangularChamber({ pressure }: { pressure: number }) {
  // Pressure dynamically adjusts the piston/right-wall or ceiling height slightly
  // Here we use a subtle upper compression indicator
  const ceilingY = 0.68 - (pressure - 1.0) * 0.08;

  return (
    <group position={[0, 0.22, 0]}>
      {/* Outer Chamber Base Plate */}
      <mesh position={[0, -0.68, 0]}>
        <boxGeometry args={[4.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Top Ceiling Plate (Moves down slightly with high pressure) */}
      <mesh position={[0, ceilingY, 0]}>
        <boxGeometry args={[4.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Clean Glass Enclosure Box */}
      <mesh position={[0, (ceilingY - 0.68) / 2 + 0.34, 0]}>
        <boxGeometry args={[4.12, ceilingY + 0.64, 1.32]} />
        <meshPhysicalMaterial
          color="#BAE6FD"
          transparent
          opacity={0.12}
          roughness={0.08}
          transmission={0.92}
          thickness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Metallic Frame Border Outlines */}
      <mesh position={[-2.06, (ceilingY - 0.68) / 2 + 0.34, 0]}>
        <boxGeometry args={[0.04, ceilingY + 0.64, 1.32]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[2.06, (ceilingY - 0.68) / 2 + 0.34, 0]}>
        <boxGeometry args={[0.04, ceilingY + 0.64, 1.32]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Subtle floor grid inside chamber */}
      <gridHelper
        args={[4.0, 8, "#94A3B8", "#E2E8F0"]}
        position={[0, -0.63, 0]}
      />

      {/* Central Collision Zone Indicator on Floor */}
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.28, 32]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// Particle Type
interface ParticleData {
  id: number;
  type: "A" | "B";
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

// Single Reactant Particle with Three.js useFrame animation
function AnimatedParticle({
  type,
  initialPos,
  initialVel,
  speedFactor,
  pressure,
  isHighSurfaceArea,
  onSpark,
  allParticlesRef,
  index,
}: {
  type: "A" | "B";
  initialPos: THREE.Vector3;
  initialVel: THREE.Vector3;
  speedFactor: number;
  pressure: number;
  isHighSurfaceArea: boolean;
  onSpark: (x: number, y: number, z: number) => void;
  allParticlesRef: React.MutableRefObject<{ pos: THREE.Vector3; type: "A" | "B" }[]>;
  index: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef<THREE.Vector3>(initialPos.clone());
  const velRef = useRef<THREE.Vector3>(initialVel.clone());

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const speed = 1.6 * speedFactor;

    // Chamber boundaries
    const minX = -1.95;
    const maxX = 1.95;
    const minY = -0.36;
    const maxY = 0.22 + 0.52 - (pressure - 1.0) * 0.08;
    const minZ = -0.55;
    const maxZ = 0.55;

    const p = posRef.current;
    const v = velRef.current;

    p.x += v.x * speed * dt;
    p.y += v.y * speed * dt;
    p.z += v.z * speed * dt;

    // Bounce off left/right walls
    if (p.x <= minX) {
      p.x = minX;
      v.x = Math.abs(v.x);
    } else if (p.x >= maxX) {
      p.x = maxX;
      v.x = -Math.abs(v.x);
    }

    // Bounce off floor/ceiling
    if (p.y <= minY) {
      p.y = minY;
      v.y = Math.abs(v.y);
    } else if (p.y >= maxY) {
      p.y = maxY;
      v.y = -Math.abs(v.y);
    }

    // Bounce off front/back glass
    if (p.z <= minZ) {
      p.z = minZ;
      v.z = Math.abs(v.z);
    } else if (p.z >= maxZ) {
      p.z = maxZ;
      v.z = -Math.abs(v.z);
    }

    // Update shared registry for collision detection
    if (allParticlesRef.current[index]) {
      allParticlesRef.current[index].pos.copy(p);
    }

    // Check collision against other opposite-type particles
    const list = allParticlesRef.current;
    const collisionThreshold = isHighSurfaceArea ? 0.30 : 0.24;
    const thresholdSq = collisionThreshold * collisionThreshold;

    for (let j = 0; j < list.length; j++) {
      if (j !== index && list[j] && list[j].type !== type) {
        const dSq = p.distanceToSquared(list[j].pos);
        if (dSq < thresholdSq) {
          // Elastic deflection: reverse direction away from other particle
          v.x = -v.x + (Math.random() - 0.5) * 0.2;
          v.y = -v.y + (Math.random() - 0.5) * 0.2;
          v.z = -v.z;
          v.normalize();
          onSpark((p.x + list[j].pos.x) / 2, (p.y + list[j].pos.y) / 2, (p.z + list[j].pos.z) / 2);
          break;
        }
      }
    }

    // Directly update Three.js object position
    groupRef.current.position.copy(p);
  });

  return (
    <group ref={groupRef} position={initialPos}>
      <mesh>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial
          color={type === "A" ? "#EF4444" : "#3B82F6"}
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>
      <Text
        position={[0, 0, 0.16]}
        fontSize={0.12}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        renderOrder={10}
        depthOffset={-1}
      >
        {type}
      </Text>
    </group>
  );
}

// 3D Dynamic Particle System for Reactants inside Chamber
function ParticleSimulation({
  temperature,
  concentration,
  pressure,
  particleSize,
  onCollisionEvent,
}: {
  temperature: number; // 273 to 450 K
  concentration: number; // 0.5 to 2.0 M
  pressure: number; // 1.0 to 3.0 atm
  particleSize: number; // 1 (Fine 1mm), 5 (Medium 5mm), 10 (Large 10mm)
  onCollisionEvent: (x: number, y: number, z: number) => void;
}) {
  // Speed multiplier derived from Maxwell-Boltzmann kinetic energy (v ~ sqrt(T))
  const speedFactor = useMemo(() => {
    return Math.sqrt(temperature / 300) * 1.3;
  }, [temperature]);

  // Total particles based on concentration and pressure compression
  const particleCount = useMemo(() => {
    const base = Math.round(16 * concentration * (1 + (pressure - 1) * 0.4));
    return Math.min(Math.max(base, 10), 38);
  }, [concentration, pressure]);

  // Generate particle definitions
  const particleDefs = useMemo(() => {
    const arr: { id: number; type: "A" | "B"; pos: THREE.Vector3; vel: THREE.Vector3 }[] = [];
    for (let i = 0; i < particleCount; i++) {
      const type = i % 2 === 0 ? "A" : "B";
      const x = (Math.random() - 0.5) * 3.4;
      const y = 0.22 + (Math.random() - 0.5) * 0.7;
      const z = (Math.random() - 0.5) * 0.8;

      const angle = Math.random() * Math.PI * 2;
      const vElev = (Math.random() - 0.5) * 0.8;
      const vx = Math.cos(angle);
      const vy = vElev;
      const vz = Math.sin(angle);

      arr.push({
        id: i,
        type,
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(vx, vy, vz).normalize(),
      });
    }
    return arr;
  }, [particleCount]);

  // Shared ref holding live positions for collision checks
  const allParticlesRef = useRef<{ pos: THREE.Vector3; type: "A" | "B" }[]>([]);

  useEffect(() => {
    allParticlesRef.current = particleDefs.map((p) => ({
      pos: p.pos.clone(),
      type: p.type,
    }));
  }, [particleDefs]);

  const sparkThrottleRef = useRef<number>(0);
  const handleSpark = (x: number, y: number, z: number) => {
    const now = performance.now();
    if (now - sparkThrottleRef.current > 160) {
      sparkThrottleRef.current = now;
      onCollisionEvent(x, y, z);
    }
  };

  const isFine = particleSize <= 2;
  const isMedium = particleSize > 2 && particleSize < 8;

  return (
    <group>
      {particleDefs.map((p, idx) => (
        <AnimatedParticle
          key={p.id}
          index={idx}
          type={p.type}
          initialPos={p.pos}
          initialVel={p.vel}
          speedFactor={speedFactor}
          pressure={pressure}
          isHighSurfaceArea={isFine}
          onSpark={handleSpark}
          allParticlesRef={allParticlesRef}
        />
      ))}

      {/* Solid Reactant representation at the chamber floor center */}
      <group position={[0, -0.48, 0]}>
        {!isFine && !isMedium ? (
          // Large chunk (10mm): Single large block
          <mesh>
            <boxGeometry args={[0.7, 0.28, 0.5]} />
            <meshStandardMaterial
              color="#64748B"
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
        ) : isMedium ? (
          // Medium pieces (5mm): 3-4 separate pieces
          <group>
            {[-0.26, 0, 0.26].map((xOffset, idx) => (
              <mesh key={idx} position={[xOffset, 0, (idx % 2 === 0 ? 0.08 : -0.08)]}>
                <boxGeometry args={[0.22, 0.22, 0.22]} />
                <meshStandardMaterial
                  color="#64748B"
                  roughness={0.6}
                  metalness={0.4}
                />
              </mesh>
            ))}
          </group>
        ) : (
          // Fine powder (1mm): Dispersed fine particles
          <group>
            {[-0.45, -0.22, 0, 0.22, 0.45].map((xOffset, idx) => (
              <mesh key={idx} position={[xOffset, 0, (idx % 2 === 0 ? 0.12 : -0.12)]}>
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshStandardMaterial
                  color="#94A3B8"
                  roughness={0.4}
                  metalness={0.5}
                />
              </mesh>
            ))}
          </group>
        )}
      </group>
    </group>
  );
}

// Sparkle Effect for Effective Rate Collisions
function CollisionSparkle({
  pos,
  active,
}: {
  pos: THREE.Vector3;
  active: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (active) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.4, 1.4, 1.4), 0.2);
    } else {
      meshRef.current.scale.set(0.001, 0.001, 0.001);
    }
  });

  return (
    <mesh ref={meshRef} position={pos} scale={0.001}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#FDE047" transparent opacity={0.8} />
    </mesh>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ReactionRateControlRoomGamePage({
  difficulty: _difficulty,
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Navigation & Intro Flow
  const [introStep, setIntroStep] = useState<"mission" | "instructions">("mission");
  const [gameStarted, setGameStarted] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Reaction Conditions Control Room States
  // 1. Concentration: 0.5 M to 2.0 M (Default 1.0 M)
  const [concentration, setConcentration] = useState<number>(1.0);
  // 2. Temperature: 280 K to 440 K (Default 300 K)
  const [temperature, setTemperature] = useState<number>(300);
  // 3. Reactant Particle Size (Surface Area): 1mm (Fine) to 10mm (Large Chunk), Default 10mm
  const [particleSize, setParticleSize] = useState<number>(10);
  // 4. Pressure: 1.0 atm to 3.0 atm (Default 1.0 atm)
  const [pressure, setPressure] = useState<number>(1.0);

  // Active Control Factor Tab in Control Room Dock
  const [activeFactor, setActiveFactor] = useState<
    "concentration" | "temperature" | "surfaceArea" | "pressure"
  >("temperature");

  // Collision Sparkle Visual State
  const [sparkPos, setSparkPos] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [isSparkActive, setIsSparkActive] = useState(false);

  const handleCollisionEvent = (x: number, y: number, z: number) => {
    setSparkPos(new THREE.Vector3(x, y, z));
    setIsSparkActive(true);
    setTimeout(() => setIsSparkActive(false), 120);
  };

  // --------------------------------------------------------------------------
  // LIVE REACTION RATE CALCULATION (KINETICS MODEL)
  // Baseline Rate = 1.0x at Conc 1.0M, Temp 300K, Surface Low, Pressure 1.0 atm
  // Target Rate = 3.0x
  // --------------------------------------------------------------------------
  const TARGET_RATE = 3.0;

  const liveRate = useMemo(() => {
    // 1. Concentration effect: Rate proportional to [A][B]
    const concFactor = Math.pow(concentration / 1.0, 1.2);
    // 2. Temperature effect: Arrhenius factor ~ +100% per ~50K
    const tempFactor = 1.0 + ((temperature - 300) / 100) * 1.6;
    // 3. Surface Area / Particle Size effect: Smaller particle size = much greater exposed surface area
    // 10mm (Large chunk) = 1.0x baseline; 5mm = ~1.33x; 1mm (Fine powder) = 1.6x boost
    const surfaceFactor = 1.0 + ((10 - particleSize) / 9) * 0.6;
    // 4. Pressure effect: Gaseous density compression
    const pressureFactor = Math.pow(pressure / 1.0, 0.7);

    const calculated = concFactor * Math.max(tempFactor, 0.4) * surfaceFactor * pressureFactor;
    return Number(Math.max(calculated, 0.2).toFixed(2));
  }, [concentration, temperature, particleSize, pressure]);

  const hasReachedTarget = liveRate >= TARGET_RATE;

  // Reset to initial standard conditions
  const handleReset = () => {
    setConcentration(1.0);
    setTemperature(300);
    setParticleSize(10);
    setPressure(1.0);
  };

  const exitSimulationHandler = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 0: MISSION INTRO POPUP SCREEN (Matches Topic 1 style)
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

          {/* Centered Mission Statement matching Topic 1 single-line style */}
          <div className="max-w-2xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              <span className="text-[#0284C7]">MISSION:</span> Control reaction conditions to achieve a reaction rate 3× the initial rate!
            </h1>

            <div>
              <button
                type="button"
                onClick={() => setIntroStep("instructions")}
                className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 inline-flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronLeft className="w-4 h-4 text-sky-200 rotate-180" />
              </button>
            </div>
          </div>

          <div className="h-8 shrink-0" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 1: INSTRUCTIONS TO PLAY (Compact 3-Card Layout matching Topic 1)
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
              {/* Card 1: Adjust Reaction Conditions */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Adjust Conditions
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-extrabold text-[9px]">
                      Collision Frequency
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Select factors like temperature, concentration, surface area, and pressure to alter particle dynamics.
                  </p>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex flex-col justify-center px-2 py-1.5 mt-2 shadow-inner">
                  {/* Miniature dock visual preview */}
                  <div className="bg-white/90 rounded-lg p-1.5 border border-slate-200/90 shadow-xs space-y-1">
                    <div className="flex items-center gap-1 justify-between">
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                        <span className="px-1.5 py-0.5 rounded bg-white text-red-600 text-[8px] font-black shadow-xs flex items-center gap-0.5">
                          <Thermometer className="w-2.5 h-2.5" /> Temp
                        </span>
                        <span className="px-1 py-0.5 text-slate-500 text-[8px] font-bold flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> Conc
                        </span>
                        <span className="px-1 py-0.5 text-slate-500 text-[8px] font-bold flex items-center gap-0.5">
                          <Layers className="w-2.5 h-2.5" /> Surf
                        </span>
                      </div>
                      <div className="text-[8px] font-mono font-bold text-slate-700">
                        300 <span className="text-[7px] text-slate-400">K</span>
                      </div>
                    </div>
                    {/* Miniature slider */}
                    <div className="w-full bg-slate-200 h-1 rounded-full relative flex items-center">
                      <div className="absolute left-[35%] w-2.5 h-2.5 bg-red-500 rounded-full shadow-xs -translate-y-[0.5px]" />
                    </div>
                    <div className="flex justify-between text-[7px] text-slate-400 font-medium px-0.5">
                      <span>Cold</span>
                      <span>300K Standard</span>
                      <span>Hot</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Monitor Rate Meter */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Monitor Live Rate
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px]">
                      Reaction Kinetics
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Observe the live reaction rate meter as collision frequency and energy thresholds increase in real time.
                  </p>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner px-3">
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span>Rate Meter</span>
                      <span className="text-emerald-600 font-extrabold">3.0× Goal</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full w-[85%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Reach Target & Submit */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Achieve &amp; Submit
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[9px]">
                      Target Goal
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    When reaction rate reaches 3.0× initial rate, the green submit button will activate. Submit to complete!
                  </p>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner">
                  <div className="text-center">
                    <span className="text-xl font-black text-emerald-600 block">≥ 3.0× Rate</span>
                    <span className="text-[10px] font-bold text-slate-400 block">TARGET REACHED</span>
                  </div>
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
          {/* Top Bar Header */}
          <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-2.5 pb-1 z-30 shrink-0">
            {/* Exit Button */}
            <button
              type="button"
              onClick={exitSimulationHandler}
              className="flex items-center gap-1.5 h-8 px-4 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-md transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Top Center: Horizontal Pill-Style Live Reaction Rate Bar */}
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Reaction Rate:
              </span>
              <span
                className={`text-sm sm:text-base font-black tracking-tight font-mono ${
                  hasReachedTarget ? "text-emerald-600" : "text-[#0284C7]"
                }`}
              >
                {liveRate.toFixed(2)}×
              </span>

              {/* Sleek Horizontal Progress Bar */}
              <div className="w-24 sm:w-36 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    hasReachedTarget
                      ? "bg-emerald-500 shadow-sm"
                      : "bg-gradient-to-r from-amber-400 to-sky-500"
                  }`}
                  style={{ width: `${Math.min((liveRate / 4.0) * 100, 100)}%` }}
                />
              </div>

              <span
                className={`text-[9.5px] font-extrabold ${
                  hasReachedTarget ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {hasReachedTarget ? "Goal Met (≥ 3.0×)" : "Goal: 3.0×"}
              </span>
            </div>

            {/* Explanation Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="flex items-center gap-1.5 h-8 px-4 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* 3D WebGL Canvas Layer (Full Screen Single Canvas) */}
          <div className="absolute inset-0 z-0">
            <Canvas gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[0, 0, 5.6]} fov={34} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 8, 5]} intensity={1.3} castShadow />
              <directionalLight position={[-5, 4, -3]} intensity={0.6} />
              <pointLight position={[0, 0.22, 0]} intensity={0.4} color="#38BDF8" />

              {/* Subtle floor grid only for spatial orientation */}
              <gridHelper
                args={[8, 16, "#E2E8F0", "#F1F5F9"]}
                position={[0, -1.1, 0]}
              />

              <Suspense fallback={null}>
                {/* Rectangular Chamber */}
                <RectangularChamber pressure={pressure} />

                {/* Reactant Particles Simulation */}
                <ParticleSimulation
                  temperature={temperature}
                  concentration={concentration}
                  pressure={pressure}
                  particleSize={particleSize}
                  onCollisionEvent={handleCollisionEvent}
                />

                {/* Collision Sparkle Flash */}
                <CollisionSparkle pos={sparkPos} active={isSparkActive} />
              </Suspense>

              <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.9}
                minAzimuthAngle={-Math.PI / 6}
                maxAzimuthAngle={Math.PI / 6}
              />
            </Canvas>
          </div>

          {/* Bottom Interactive Control Dock (Compact Height) */}
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-2.5 sm:pb-3.5 z-20">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3.5">
              {/* Factor Tabs Navigation */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFactor("temperature")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFactor === "temperature"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>Temp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFactor("concentration")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFactor === "concentration"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Conc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFactor("surfaceArea")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFactor === "surfaceArea"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Surface</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFactor("pressure")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFactor === "pressure"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Pressure</span>
                </button>
              </div>

              {/* Dynamic Sub-Control based on Active Tab */}
              <div className="flex-1 w-full max-w-xs px-2">
                {activeFactor === "temperature" && (
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-red-500" />
                        Temperature
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {temperature} <span className="text-[10px] text-slate-400">K</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="280"
                      max="440"
                      step="10"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <div className="flex justify-between text-[8.5px] text-slate-400 mt-0.5">
                      <span>280K (Cold)</span>
                      <span>300K (Standard)</span>
                      <span>440K (Hot)</span>
                    </div>
                  </div>
                )}

                {activeFactor === "concentration" && (
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-blue-500" />
                        Concentration [A] &amp; [B]
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {concentration.toFixed(1)}{" "}
                        <span className="text-[10px] text-slate-400">M</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={concentration}
                      onChange={(e) => setConcentration(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[8.5px] text-slate-400 mt-0.5">
                      <span>0.5M (Dilute)</span>
                      <span>1.0M (Normal)</span>
                      <span>2.0M (Dense)</span>
                    </div>
                  </div>
                )}

                {activeFactor === "surfaceArea" && (
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-purple-500" />
                        Reactant Particle Size
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {particleSize} <span className="text-[10px] text-slate-400">mm ({particleSize <= 2 ? "Fine Powder" : particleSize <= 6 ? "Medium Pieces" : "Large Chunk"})</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={particleSize}
                      onChange={(e) => setParticleSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-[8.5px] text-slate-400 mt-0.5">
                      <span className="text-purple-600 font-semibold">1mm (Fine Powder - Fast)</span>
                      <span>5mm (Medium)</span>
                      <span>10mm (Large Chunk - Slow)</span>
                    </div>
                  </div>
                )}

                {activeFactor === "pressure" && (
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-emerald-500" />
                        Gas Pressure (P)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {pressure.toFixed(1)}{" "}
                        <span className="text-[10px] text-slate-400">atm</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.2"
                      value={pressure}
                      onChange={(e) => setPressure(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[8.5px] text-slate-400 mt-0.5">
                      <span>1.0 atm</span>
                      <span>2.0 atm</span>
                      <span>3.0 atm</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: SUBMIT replaces RESET when target is achieved (Matching Topic 1) */}
              <div className="flex items-center gap-2">
                {hasReachedTarget ? (
                  <button
                    type="button"
                    onClick={() => setShowVictoryModal(true)}
                    className="px-7 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SUBMIT</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 3: EXPLANATION MODAL (Clean Full-Screen Rounded Modal)
          ══════════════════════════════════════════════════════════════════════ */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white/98 backdrop-blur-md animate-in fade-in duration-150 rounded-3xl sm:rounded-[32px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-white">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Reaction Rate Control Room Guide
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Module 05: Chemical Kinetics • Factors Affecting Reaction Rates
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

          {/* Single Column Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 space-y-6 text-slate-700 leading-relaxed font-sans text-xs sm:text-sm">
            {/* PART 1: CORE SCIENCE CONCEPT */}
            <div className="space-y-3 bg-sky-50/70 p-4 rounded-2xl border border-sky-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                PART 1: CORE SCIENCE CONCEPT
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                What Are We Learning Here?
              </h3>
              <p className="text-slate-600">
                In Chemical Kinetics, reactions don&apos;t all occur at the same speed—some take seconds (like an explosion) while others take years (like rust). This simulation teaches how changing physical and chemical conditions directly controls the speed (reaction rate) of a chemical reaction, based on <strong>Collision Theory</strong>:
              </p>
              <div className="font-mono font-bold text-xs sm:text-sm text-sky-900 bg-white py-2.5 px-4 rounded-xl border border-sky-200 shadow-xs">
                Reaction Rate ∝ (Collision Frequency) × (Fraction of Effective Collisions exceeding Ea)
              </div>
              <p className="text-slate-600 pt-1">
                Students discover the <strong>4 fundamental factors</strong> that alter this rate:
              </p>
            </div>

            {/* Factor 1: Temperature */}
            <div className="space-y-2 border-l-3 border-red-500 pl-3 sm:pl-4">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                1. Temperature (T)
              </h4>
              <ul className="space-y-1 text-slate-600 pl-1">
                <li>
                  <strong className="text-slate-800">What happens:</strong> Heating molecules makes them move faster (particles gain kinetic energy, v_rms ∝ √T).
                </li>
                <li>
                  <strong className="text-slate-800">Why rate increases:</strong> Fast molecules collide more often and with much greater kinetic energy, so a drastically higher percentage of collisions exceed the Activation Energy (Ea) barrier.
                </li>
              </ul>
            </div>

            {/* Factor 2: Concentration */}
            <div className="space-y-2 border-l-3 border-blue-500 pl-3 sm:pl-4">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                2. Concentration ([A] and [B])
              </h4>
              <ul className="space-y-1 text-slate-600 pl-1">
                <li>
                  <strong className="text-slate-800">What happens:</strong> Adding more reactant molecules packs them closer together into the same chamber volume.
                </li>
                <li>
                  <strong className="text-slate-800">Why rate increases:</strong> A denser crowd of particles leads to far more frequent collisions per second.
                </li>
              </ul>
            </div>

            {/* Factor 3: Surface Area */}
            <div className="space-y-2 border-l-3 border-purple-500 pl-3 sm:pl-4">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                3. Surface Area of Reactants (Particle Size)
              </h4>
              <p className="text-slate-600">
                In chemistry, <strong>Surface Area controls how many reactant atoms can touch each other</strong>.
              </p>
              <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-100 text-slate-700 space-y-1.5 my-1">
                <p className="font-bold text-purple-900 text-xs uppercase tracking-wide">
                  Think of a Sugar Cube vs. Powdered Sugar:
                </p>
                <ul className="space-y-1 text-xs">
                  <li>
                    <strong className="text-slate-800">• Large Chunk (10 mm):</strong> Like a solid sugar cube. Water can only touch the outside surface. The inside sugar is hidden, so it dissolves <strong>very slowly</strong>.
                  </li>
                  <li>
                    <strong className="text-slate-800">• Fine Powder (1 mm):</strong> When crushed into tiny powder grains, all interior particles are exposed to collisions all at once, so it reacts <strong>much faster</strong>!
                  </li>
                </ul>
              </div>
              <ul className="space-y-1 text-slate-600 pl-1">
                <li>
                  <strong className="text-slate-800">What happens:</strong> Breaking a large solid lump (10 mm) down into fine powder (1 mm).
                </li>
                <li>
                  <strong className="text-slate-800">Why rate increases:</strong> Powder exposes millions of interior atoms directly to the surrounding reactants, vastly multiplying the contact collision points per second.
                </li>
              </ul>
            </div>

            {/* Factor 4: Pressure */}
            <div className="space-y-2 border-l-3 border-emerald-500 pl-3 sm:pl-4">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                4. Pressure (P) for Gaseous Reactions
              </h4>
              <ul className="space-y-1 text-slate-600 pl-1">
                <li>
                  <strong className="text-slate-800">What happens:</strong> Compressing the chamber lowers its volume (V ∝ 1/P).
                </li>
                <li>
                  <strong className="text-slate-800">Why rate increases:</strong> Gas molecules are forced closer together, effectively multiplying their concentration and collision rate.
                </li>
              </ul>
            </div>

            {/* PART 2: HOW TO PLAY THE GAME */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-200/80 px-2.5 py-0.5 rounded-full inline-block">
                PART 2: HOW TO PLAY (STEP-BY-STEP)
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                The Mission Goal
              </h3>
              <ul className="space-y-1 text-slate-600 pl-1">
                <li>
                  <strong className="text-slate-800">Starting Condition:</strong> Standard baseline (1.0 M concentration, 300 K room temp, solid lump surface area, 1.0 atm pressure), which gives a starting rate of <strong>1.0×</strong>.
                </li>
                <li>
                  <strong className="text-slate-800">Your Target:</strong> Experiment with the controls to speed up the reaction until the Live Reaction Rate reaches <strong>≥ 3.0×</strong> (3 times the initial speed).
                </li>
              </ul>

              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 pt-2 border-t border-slate-200">
                Gameplay Steps:
              </h4>
              <ol className="list-decimal list-inside space-y-2 pl-1 text-slate-600">
                <li>
                  <strong className="text-slate-800">Explore the Chamber:</strong> Inside the glass chamber, watch the red (A) and blue (B) particles bounce off the walls and collide, creating yellow collision sparkles.
                </li>
                <li>
                  <strong className="text-slate-800">Switch Tabs in the Bottom Dock:</strong> Click on the <strong>Temp</strong>, <strong>Conc</strong>, <strong>Surface</strong>, or <strong>Pressure</strong> tab to test one factor at a time.
                </li>
                <li>
                  <strong className="text-slate-800">Adjust the Conditions:</strong>
                  <ul className="list-disc list-inside pl-4 pt-1 space-y-1 text-slate-600">
                    <li><strong>Temperature:</strong> Slide the slider right (e.g. from 300 K up to 360 K – 400 K) → see the particles speed up instantly!</li>
                    <li><strong>Concentration:</strong> Slide from 1.0 M up to 1.5 M – 2.0 M → watch the chamber fill with more reactant particles.</li>
                    <li><strong>Surface Area:</strong> Switch from Solid Lump to Fine Powder → gives an instant boost to reactive surface sites.</li>
                    <li><strong>Pressure:</strong> Increase pressure up to 2.0 – 3.0 atm → compresses the gas density.</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-slate-800">Watch the Live Reaction Rate Meter (Top Right):</strong> As you change sliders, the rate meter smoothly climbs: 1.2× → 1.8× → 2.5× → 3.2×.
                </li>
                <li>
                  <strong className="text-slate-800">Submit When Ready:</strong> When the rate reaches ≥ 3.0×, the top status pill turns green and the green <strong>SUBMIT</strong> button lights up in the bottom dock. Click it to complete the level!
                </li>
              </ol>
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

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 4: VICTORY MODAL (SCORE BREAKDOWN & MASTERY)
          ══════════════════════════════════════════════════════════════════════ */}
      {showVictoryModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-w-sm w-full text-center space-y-3.5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                CHALLENGE COMPLETED
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Reaction Control Master!
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                You successfully regulated reaction conditions and boosted the reaction rate past 3.0×!
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Score:</span>
                <span className="font-black text-emerald-600 text-sm">100 / 100</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Achieved Rate:</span>
                <span className="font-black text-emerald-600">{liveRate.toFixed(2)}× Initial</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Conditions:</span>
                <span className="font-black text-slate-800">
                  {temperature}K • {concentration}M • {particleSize}mm Size
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  setShowVictoryModal(false);
                }}
                className="flex-1 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
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
                className="flex-1 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 transform hover:scale-105 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explanation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
