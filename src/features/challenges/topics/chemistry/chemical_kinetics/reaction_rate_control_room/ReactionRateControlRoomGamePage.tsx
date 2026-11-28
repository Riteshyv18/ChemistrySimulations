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
  ChevronUp,
  ChevronDown,
  X,
  Play,
  CheckCircle2,
  XCircle,
  Check,
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
  // Pressure compresses the piston ceiling downward inside the taller chamber
  const baseY = -0.68;
  const topY = 0.96;
  const wallHeight = topY - baseY;
  const wallCenterY = (topY + baseY) / 2;
  const ceilingY = 0.92 - (pressure - 1.0) * 0.16;

  return (
    <group position={[0, 0.22, 0]}>
      {/* Outer Chamber Base Plate */}
      <mesh position={[0, baseY, 0]}>
        <boxGeometry args={[4.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Top Ceiling Piston Plate (Moves down with high pressure) */}
      <mesh position={[0, ceilingY, 0]}>
        <boxGeometry args={[4.12, 0.08, 1.32]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Clean Glass Enclosure Box (Flush from base to top) */}
      <mesh position={[0, wallCenterY, 0]}>
        <boxGeometry args={[4.12, wallHeight, 1.32]} />
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

      {/* Metallic Side Walls (Flush from base to top) */}
      <mesh position={[-2.06, wallCenterY, 0]}>
        <boxGeometry args={[0.04, wallHeight, 1.32]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[2.06, wallCenterY, 0]}>
        <boxGeometry args={[0.04, wallHeight, 1.32]} />
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

    // Chamber boundaries (aligned with base plate and ceiling piston)
    const minX = -1.91;
    const maxX = 1.91;
    const minY = -0.29;
    const maxY = 0.22 + 0.92 - 0.17 - (pressure - 1.0) * 0.16;
    const minZ = -0.52;
    const maxZ = 0.52;

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

    // Check elastic collision against all other particles (A+B sparks, A+A & B+B bounce)
    const list = allParticlesRef.current;
    const collisionThreshold = isHighSurfaceArea ? 0.36 : 0.27;
    const thresholdSq = collisionThreshold * collisionThreshold;

    for (let j = 0; j < list.length; j++) {
      if (j !== index && list[j]) {
        const dx = p.x - list[j].pos.x;
        const dy = p.y - list[j].pos.y;
        const dz = p.z - list[j].pos.z;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq < thresholdSq && dSq > 0.0001) {
          const dist = Math.sqrt(dSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          // Push out of overlap so spheres bounce cleanly instead of clipping
          const overlap = (collisionThreshold - dist) * 0.55;
          p.x += nx * overlap;
          p.y += ny * overlap;
          p.z += nz * overlap;

          // Elastic reflection along collision normal
          const dot = v.x * nx + v.y * ny + v.z * nz;
          if (dot < 0) {
            v.x -= 2 * dot * nx;
            v.y -= 2 * dot * ny;
            v.z -= 2 * dot * nz;
            v.normalize();
          }

          if (list[j].type !== type) {
            onSpark((p.x + list[j].pos.x) / 2, (p.y + list[j].pos.y) / 2, (p.z + list[j].pos.z) / 2);
          }
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
  temperature: number;
  concentration: number; // 0.5 to 2.0 M
  pressure: number; // 1.0 to 3.0 atm
  particleSize: number; // 1 (Fine 1mm), 5 (Medium 5mm), 10 (Large 10mm)
  onCollisionEvent: (x: number, y: number, z: number) => void;
}) {
  // Visually clear kinetic speed scaling: slow at 280K (0.55x), standard at 300K (0.83x), fast at 440K (2.8x)
  // Plus slight compression agitation from higher pressure
  const speedFactor = useMemo(() => {
    const tempScale = 0.55 + ((temperature - 280) / 160) * 2.25;
    const pressureAgitation = 1 + (pressure - 1.0) * 0.15;
    return tempScale * pressureAgitation;
  }, [temperature, pressure]);

  // Total particles scale clearly with concentration (0.5M -> ~8) and pressure compression
  const particleCount = useMemo(() => {
    const base = Math.round(16 * concentration * (1 + (pressure - 1) * 0.45));
    return Math.min(Math.max(base, 8), 38);
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

  const handleSpark = (x: number, y: number, z: number) => {
    onCollisionEvent(x, y, z);
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

interface SparkSlot {
  pos: THREE.Vector3;
  life: number; // 0 = inactive, > 0 = decaying flash
}

// Pool of simultaneous collision sparkle bursts (60fps ref-driven, zero React re-renders)
function CollisionSparklePool({
  sparksRef,
}: {
  sparksRef: React.MutableRefObject<SparkSlot[]>;
}) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const slots = sparksRef.current;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      if (slot.life > 0) {
        slot.life = Math.max(0, slot.life - dt * 5.2);
        const s = Math.sin(slot.life * Math.PI) * 1.45;
        mesh.position.copy(slot.pos);
        mesh.scale.setScalar(Math.max(0.001, s));
      } else {
        mesh.scale.setScalar(0.001);
      }
    }
  });

  return (
    <group>
      {Array.from({ length: 10 }).map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            meshRefs.current[idx] = el;
          }}
          scale={0.001}
        >
          <sphereGeometry args={[0.15, 14, 14]} />
          <meshBasicMaterial color="#FDE047" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
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
  const [showFailModal, setShowFailModal] = useState(false);

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
  const [showFactorDropdown, setShowFactorDropdown] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Pool of 10 simultaneous collision flashes
  const sparksRef = useRef<SparkSlot[]>(
    Array.from({ length: 10 }, () => ({ pos: new THREE.Vector3(), life: 0 }))
  );
  const sparkCursorRef = useRef(0);

  const handleCollisionEvent = (x: number, y: number, z: number) => {
    const idx = sparkCursorRef.current;
    sparkCursorRef.current = (idx + 1) % sparksRef.current.length;
    sparksRef.current[idx].pos.set(x, y, z);
    sparksRef.current[idx].life = 1.0;
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
              {/* Card 1: Choose a Factor */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Choose a Factor
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Open the bottom menu and pick <strong>Temp</strong>, <strong>Conc</strong>, <strong>Surface</strong>, or <strong>Pressure</strong>.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/rate_step1_dropdown.png"
                    alt="Factor Selection Dropdown"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Card 2: Watch Collisions */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Watch Collisions
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Observe how the reactant particles move and collide inside the glass chamber.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/rate_step2_chamber.png"
                    alt="3D Particle Collisions in Chamber"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Card 3: Adjust & Submit */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Adjust &amp; Submit
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Drag the slider to change the condition, then tap <strong>SUBMIT</strong> to check your result!
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/rate_step3_submit.png"
                    alt="Slider and Submit Button"
                    className="w-full h-full object-contain rounded-lg"
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

                {/* Simultaneous Collision Sparkle Flashes */}
                <CollisionSparklePool sparksRef={sparksRef} />
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

          {/* Auto-dismissing feedback toast on wrong submit */}
          {errorToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-md w-[88%] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-1.5 px-4 rounded-full shadow-lg border bg-red-50/95 border-red-300 text-red-900 flex items-center justify-center gap-2 text-center">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-[11px] sm:text-xs font-black tracking-tight">{errorToast}</span>
              </div>
            </div>
          )}

          {/* Bottom Interactive Control Dock (Compact Height) */}
          <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pb-2 sm:pb-3 z-20">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-xl border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">
              {/* Factor Selector Dropdown */}
              <div className="relative shrink-0">
                {showFactorDropdown && (
                  <div className="absolute bottom-full left-0 w-52 mb-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/15 p-1.5 z-50 space-y-1 animate-in fade-in duration-150">
                    {(
                      [
                        {
                          id: "temperature",
                          label: "Temp",
                          desc: "Temperature (K)",
                          icon: Thermometer,
                          badgeClass: "bg-red-50 border-red-200 text-red-600",
                        },
                        {
                          id: "concentration",
                          label: "Conc",
                          desc: "Concentration (M)",
                          icon: Flame,
                          badgeClass: "bg-blue-50 border-blue-200 text-blue-600",
                        },
                        {
                          id: "surfaceArea",
                          label: "Surface",
                          desc: "Particle Size (mm)",
                          icon: Layers,
                          badgeClass: "bg-purple-50 border-purple-200 text-purple-600",
                        },
                        {
                          id: "pressure",
                          label: "Pressure",
                          desc: "Gas Pressure (atm)",
                          icon: Gauge,
                          badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-600",
                        },
                      ] as const
                    ).map((opt) => {
                      const Icon = opt.icon;
                      const active = activeFactor === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setActiveFactor(opt.id);
                            setShowFactorDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                            active
                              ? "bg-sky-50/90 border-sky-300 text-slate-900"
                              : "bg-white border-transparent hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${opt.badgeClass}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black leading-tight">{opt.label}</div>
                              <div className="text-[9.5px] font-medium text-slate-500 truncate">{opt.desc}</div>
                            </div>
                          </div>
                          {active && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowFactorDropdown((prev) => !prev)}
                  className="h-9 px-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs tracking-wide shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  {activeFactor === "temperature" && <Thermometer className="w-3.5 h-3.5" />}
                  {activeFactor === "concentration" && <Flame className="w-3.5 h-3.5" />}
                  {activeFactor === "surfaceArea" && <Layers className="w-3.5 h-3.5" />}
                  {activeFactor === "pressure" && <Gauge className="w-3.5 h-3.5" />}
                  <span>
                    {activeFactor === "temperature"
                      ? "Temp"
                      : activeFactor === "concentration"
                        ? "Conc"
                        : activeFactor === "surfaceArea"
                          ? "Surface"
                          : "Pressure"}
                  </span>
                  {showFactorDropdown ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
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
                        {particleSize} <span className="text-[10px] text-slate-400">mm</span>
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
                  </div>
                )}
              </div>

              {/* Action Button: Submit only (auto-resets if rate < 3.0x) */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowFactorDropdown(false);
                    if (hasReachedTarget) {
                      setShowVictoryModal(true);
                    } else {
                      handleReset();
                      setShowFailModal(true);
                    }
                  }}
                  className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SUBMIT</span>
                </button>
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
                  <strong className="text-slate-800">Select Factors from the Dropdown:</strong> Use the bottom-left dropdown to switch between <strong>Temp</strong>, <strong>Conc</strong>, <strong>Surface</strong>, and <strong>Pressure</strong>.
                </li>
                <li>
                  <strong className="text-slate-800">Adjust the Conditions:</strong>
                  <ul className="list-disc list-inside pl-4 pt-1 space-y-1 text-slate-600">
                    <li><strong>Temperature:</strong> Slide the slider right (e.g. from 300 K up to 360 K – 440 K) → see the particles speed up!</li>
                    <li><strong>Concentration:</strong> Slide from 1.0 M up to 1.5 M – 2.0 M → watch the chamber fill with more reactant particles.</li>
                    <li><strong>Surface Area:</strong> Lower particle size toward 1 mm (Fine Powder) → boosts reactive collisions.</li>
                    <li><strong>Pressure:</strong> Increase pressure up to 2.0 – 3.0 atm → compresses the gas volume.</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-slate-800">Submit When Ready:</strong> Once your conditions boost the reaction rate to at least <strong>3.0×</strong>, tap <strong>SUBMIT</strong>!
                </li>
              </ol>

              {/* Winning Combinations Box */}
              <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-2 text-xs sm:text-sm text-emerald-900">
                <h4 className="font-extrabold text-xs sm:text-sm text-emerald-950">
                  How to Win (Target: Rate &ge; 3.0&times; from 1.0&times; baseline)
                </h4>
                <p className="leading-relaxed">
                  Starting from <strong>300 K, 1.0 M, 10 mm, 1.0 atm</strong>, any combination reaching <strong>&ge; 3.0&times;</strong> wins when you tap <strong>SUBMIT</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li>
                    <strong>Temperature alone:</strong> Slide <strong>Temp</strong> up to <strong>430 K</strong> (3.08&times;) or <strong>440 K</strong> (3.24&times;).
                  </li>
                  <li>
                    <strong>Temp + Conc:</strong> Set <strong>Temp = 360 K</strong> and <strong>Conc = 1.5 M</strong> (3.19&times;).
                  </li>
                  <li>
                    <strong>Mix all factors:</strong> Raise <strong>Temp</strong> (350 K+), raise <strong>Conc</strong> (1.5 M+), lower <strong>Surface</strong> particle size (1&ndash;3 mm), or raise <strong>Pressure</strong> (2.0 atm+), then tap <strong>SUBMIT</strong>.
                  </li>
                </ul>
              </div>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 max-w-sm w-full text-center space-y-2.5 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                CHALLENGE COMPLETED
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5 leading-tight">
                Reaction Control Master!
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                You boosted the reaction rate past 3.0× by regulating the reaction conditions!
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1 text-left">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600">Score:</span>
                <span className="font-black text-emerald-600 text-xs">100 / 100</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600">Achieved Rate:</span>
                <span className="font-black text-emerald-600">{liveRate.toFixed(2)}× Initial</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600">Conditions:</span>
                <span className="font-black text-slate-800">
                  {temperature}K • {concentration}M • {particleSize}mm
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  setShowVictoryModal(false);
                }}
                className="flex-1 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
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
                className="flex-1 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 transform hover:scale-105 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explanation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 5: RETRY MODAL (RATE BELOW TARGET)
          ══════════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 max-w-xs w-full text-center space-y-2.5 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <XCircle className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                Reaction Too Slow!
              </h2>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                The reaction rate did not reach the target speed yet. Conditions have been reset—try boosting Temperature, Concentration, Surface Area, or Pressure!
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setShowFailModal(false)}
                className="flex-1 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFailModal(false);
                  setShowExplanationModal(true);
                }}
                className="flex-1 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
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
