"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  X,
  PlusCircle,
  MinusCircle,
  Flame,
  Snowflake,
  ArrowUpFromLine,
  ArrowDownToLine,
  Activity,
  CheckCircle2,
  AlertCircle,
  Gauge,
  Zap,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ============================================================================
// TYPES & 3D STRUCTURES
// ============================================================================

interface Particle3DData {
  id: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

// Particle sphere geometry and materials
const particleGeo = new THREE.SphereGeometry(0.12, 16, 16);
const particleMat = new THREE.MeshStandardMaterial({
  color: "#38BDF8", // Cyan-blue gas atom
  roughness: 0.2,
  metalness: 0.3,
  emissive: "#0284C7",
  emissiveIntensity: 0.35,
});

// ----------------------------------------------------------------------------
// 3D REALISTIC ELECTRIC HEATER COIL COMPONENT
// ----------------------------------------------------------------------------
function HeaterCoil({ active, isCooling }: { active: boolean; isCooling: boolean }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);

  // Build a smooth spiral heating element (Archimedean spiral tube)
  const coilGeo = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const turns = 4.5;
    const segments = 160;
    const minR = 0.14;
    const maxR = 1.12;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * turns * Math.PI * 2;
      const r = minR + (maxR - minR) * t;
      points.push(new THREE.Vector3(Math.cos(angle) * r, -1.39, Math.sin(angle) * r));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 160, 0.042, 12, false);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * 7);
    if (matRef.current) {
      if (active) {
        matRef.current.emissiveIntensity = 1.6 + pulse * 0.9;
      } else if (isCooling) {
        matRef.current.emissiveIntensity = 1.2 + pulse * 0.6;
      } else {
        matRef.current.emissiveIntensity = 0;
      }
    }
    if (glowRef.current) {
      glowRef.current.opacity = 0.28 + pulse * 0.18;
    }
  });

  const coilColor = active ? "#FB923C" : isCooling ? "#38BDF8" : "#334155";
  const emissiveColor = active ? "#EA580C" : isCooling ? "#0284C7" : "#000000";

  return (
    <group>
      {/* Realistic Spiral Nichrome Heating Coil */}
      <mesh geometry={coilGeo} castShadow>
        <meshStandardMaterial
          ref={matRef}
          color={coilColor}
          emissive={emissiveColor}
          emissiveIntensity={active ? 2.0 : isCooling ? 1.4 : 0}
          roughness={active || isCooling ? 0.25 : 0.38}
          metalness={active || isCooling ? 0.35 : 0.75}
        />
      </mesh>

      {/* Support Spokes holding the spiral coil */}
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, idx) => (
        <mesh
          key={idx}
          position={[Math.cos(angle) * 0.62, -1.415, Math.sin(angle) * 0.62]}
          rotation={[0, -angle, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.018, 0.018, 1.15, 8]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Subtle Radiant Thermal Glow Disc & Point Light when active */}
      {(active || isCooling) && (
        <>
          <mesh position={[0, -1.418, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.22, 48]} />
            <meshBasicMaterial
              ref={glowRef}
              color={active ? "#F97316" : "#38BDF8"}
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>
          <pointLight
            position={[0, -1.15, 0]}
            color={active ? "#FB923C" : "#38BDF8"}
            intensity={active ? 2.2 : 1.5}
            distance={3.2}
          />
        </>
      )}
    </group>
  );
}
function GasParticleMesh({
  data,
  pistonHeight,
  speedMultiplier,
}: {
  data: Particle3DData;
  pistonHeight: number;
  speedMultiplier: number;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Move particle according to velocity scaled by energy/temperature
    const step = delta * 2.2 * speedMultiplier;
    data.pos.addScaledVector(data.vel, step);

    // Radial cylinder collision (cylinder radius = 1.35)
    const rSq = data.pos.x * data.pos.x + data.pos.z * data.pos.z;
    const maxR = 1.25;
    if (rSq > maxR * maxR) {
      const norm = new THREE.Vector3(data.pos.x, 0, data.pos.z).normalize();
      data.vel.reflect(norm).multiplyScalar(0.98);
      data.pos.x = norm.x * (maxR - 0.02);
      data.pos.z = norm.z * (maxR - 0.02);
    }

    // Bottom floor collision
    const floorY = -1.35;
    if (data.pos.y < floorY + 0.12) {
      data.pos.y = floorY + 0.12;
      data.vel.y = Math.abs(data.vel.y);
    }

    // Top movable piston collision
    const topY = pistonHeight - 0.18;
    if (data.pos.y > topY) {
      data.pos.y = topY;
      data.vel.y = -Math.abs(data.vel.y);
    }

    meshRef.current.position.copy(data.pos);
  });

  return (
    <group ref={meshRef} position={data.pos}>
      <mesh geometry={particleGeo} material={particleMat} castShadow />
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D CYLINDER & MOVABLE PISTON ASSEMBLY (Exact match to reference photo)
// ----------------------------------------------------------------------------
function CylinderPistonAssembly({
  pistonHeight,
  isHeating,
  isCooling,
  pressure,
}: {
  pistonHeight: number;
  isHeating: boolean;
  isCooling: boolean;
  pressure: number;
}) {
  const radius = 1.45;
  const cylinderHeight = 3.6;
  const cylinderBottom = -1.45;
  const topCoverY = cylinderBottom + cylinderHeight;

  // Exact forest/teal dark green shade from reference image
  const greenMatColor = "#1B4D3E";
  const greenRoughness = 0.35;
  const greenMetalness = 0.25;

  // Pipe material color: Warm Bright Yellow
  const yellowPipeColor = "#FACC15";

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Base Stand: Dark Green Platform */}
      <mesh position={[0, cylinderBottom - 0.22, 0]}>
        <cylinderGeometry args={[1.9, 2.15, 0.32, 64]} />
        <meshStandardMaterial color={greenMatColor} roughness={greenRoughness} metalness={greenMetalness} />
      </mesh>

      {/* Burner Plate: Dark Metallic Burner Grid */}
      <mesh position={[0, cylinderBottom - 0.05, 0]}>
        <cylinderGeometry args={[radius * 0.98, radius * 0.98, 0.08, 48]} />
        <meshStandardMaterial
          color="#0F2E24"
          roughness={0.5}
          metalness={0.5}
        />
      </mesh>

      {/* Realistic Electric Heater Coil Component */}
      <HeaterCoil active={isHeating} isCooling={isCooling} />

      {/* Silver metallic inner ring groove on base (seen in photo) */}
      <mesh position={[0, cylinderBottom - 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.72, radius * 0.78, 48]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* 2. Transparent Glass Cylinder Body */}
      <mesh position={[0, cylinderBottom + cylinderHeight / 2, 0]}>
        <cylinderGeometry args={[radius, radius, cylinderHeight, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#F8FAFC"
          transparent
          opacity={0.28}
          roughness={0.05}
          transmission={0.94}
          ior={1.48}
          thickness={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Top Green Flat Lid / Cover with central opening */}
      <mesh position={[0, topCoverY, 0]}>
        <cylinderGeometry args={[radius * 1.06, radius * 1.06, 0.14, 48]} />
        <meshStandardMaterial color={greenMatColor} roughness={greenRoughness} metalness={greenMetalness} />
      </mesh>

      {/* Rod Guide Bushing on Top Lid */}
      <mesh position={[0, topCoverY - 0.18, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.28, 32]} />
        <meshStandardMaterial color="#13392E" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Volume Graduation Tick Marks on Front Glass */}
      <group position={[0, 0, radius * 0.985]}>
        <Text position={[0.42, cylinderBottom + 0.8, 0]} fontSize={0.11} color="#334155" anchorX="left">
          — 0.5 L —
        </Text>
        <Text position={[0.42, cylinderBottom + 1.6, 0]} fontSize={0.11} color="#334155" anchorX="left">
          — 1.0 L —
        </Text>
        <Text position={[0.42, cylinderBottom + 2.4, 0]} fontSize={0.11} color="#334155" anchorX="left">
          — 1.5 L —
        </Text>
        <Text position={[0.42, cylinderBottom + 3.2, 0]} fontSize={0.11} color="#334155" anchorX="left">
          — 2.0 L —
        </Text>
      </group>

      {/* 3. Movable Piston Head (Slides vertically according to pistonHeight) */}
      <group position={[0, pistonHeight, 0]}>
        {/* Piston Disc Head - Forest Green */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[radius * 0.98, radius * 0.98, 0.26, 48]} />
          <meshStandardMaterial color={greenMatColor} roughness={greenRoughness} metalness={greenMetalness} />
        </mesh>

        {/* Dual Piston Sealing Rings (Dark rubber groove around disc edge) */}
        <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 0.98, 0.025, 16, 48]} />
          <meshStandardMaterial color="#0F172A" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 0.98, 0.025, 16, 48]} />
          <meshStandardMaterial color="#0F172A" roughness={0.8} />
        </mesh>

        {/* Vertical Chrome Connecting Rod sliding through top lid */}
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 2.1, 32]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.92} roughness={0.15} />
        </mesh>
      </group>

      {/* 4. Top-Mounted Pressure Gauge Watch & Right Side Pipe */}
      {/* (A) Circular Watch placed to the RIGHT side on top of the cylinder lid, brought forward (+Z) so its bottom half is fully visible */}
      <group position={[0.78, topCoverY + 0.45, 0.28]}>
        {/* Outer Circular Green Frame of Watch */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.48, 0.48, 0.15, 48]} />
          <meshStandardMaterial color={greenMatColor} roughness={0.3} metalness={0.3} />
        </mesh>

        {/* White Clock / Watch Face (Facing directly forward towards viewer) */}
        <mesh position={[0, 0, 0.08]}>
          <circleGeometry args={[0.40, 48]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Outer Watch Rim Ring */}
        <mesh position={[0, 0, 0.085]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.39, 0.42, 48]} />
          <meshStandardMaterial color="#0A261E" roughness={0.4} />
        </mesh>

        {/* Watch Labels */}
        <Text position={[0, 0.20, 0.09]} fontSize={0.065} color="#0F172A" anchorX="center" fontWeight="bold">
          PRESSURE (atm)
        </Text>
        <Text position={[0, -0.16, 0.09]} fontSize={0.085} color="#0284C7" anchorX="center" fontWeight="bold">
          {pressure.toFixed(2)}
        </Text>

        {/* Pressure Needle (Red indicator pointer) */}
        <group position={[0, 0.02, 0.095]} rotation={[0, 0, -((pressure - 1.0) / 3.0) * Math.PI + Math.PI / 4]}>
          <mesh position={[0, 0.13, 0]}>
            <boxGeometry args={[0.022, 0.24, 0.005]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[0.035, 24]} />
            <meshBasicMaterial color="#0F172A" />
          </mesh>
        </group>

        {/* Watch Base Collar sitting on lid */}
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.26, 0.32, 0.18, 32]} />
          <meshStandardMaterial color={greenMatColor} roughness={0.3} />
        </mesh>
      </group>

      {/* (B) Thicker Yellow Pipe connecting from right of watch horizontally, down, and into chamber */}
      <group position={[0, 0, 0.28]}>
        {/* Horizontal pipe from watch (x=1.26 to x=1.82) at Y = topCoverY + 0.41 */}
        <mesh position={[1.54, topCoverY + 0.41, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.10, 0.10, 0.56, 24]} />
          <meshStandardMaterial color={yellowPipeColor} roughness={0.3} metalness={0.15} />
        </mesh>

        {/* Top-right corner elbow / bend sphere - perfectly sealing intersection at [1.82, topCoverY + 0.41, 0] */}
        <mesh position={[1.82, topCoverY + 0.41, 0]}>
          <sphereGeometry args={[0.105, 24, 24]} />
          <meshStandardMaterial color={yellowPipeColor} roughness={0.3} metalness={0.15} />
        </mesh>

        {/* Vertical thicker yellow pipe running down from Y = topCoverY + 0.41 to Y = cylinderBottom + 0.16 (radius = 0.10) */}
        <mesh position={[1.82, (topCoverY + 0.41 + cylinderBottom + 0.16) / 2, 0]}>
          <cylinderGeometry args={[0.10, 0.10, (topCoverY + 0.41) - (cylinderBottom + 0.16), 24]} />
          <meshStandardMaterial color={yellowPipeColor} roughness={0.3} metalness={0.15} />
        </mesh>

        {/* Bottom-right corner elbow bend sphere - perfectly sealing intersection at [1.82, cylinderBottom + 0.16, 0] */}
        <mesh position={[1.82, cylinderBottom + 0.16, 0]}>
          <sphereGeometry args={[0.105, 24, 24]} />
          <meshStandardMaterial color={yellowPipeColor} roughness={0.3} metalness={0.15} />
        </mesh>

        {/* Horizontal inlet pipe into lower chamber wall (from x=1.82 to x=1.52) */}
        <mesh position={[1.67, cylinderBottom + 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.10, 0.10, 0.30, 24]} />
          <meshStandardMaterial color={yellowPipeColor} roughness={0.3} metalness={0.15} />
        </mesh>

        {/* Dark collar connector plug at chamber inlet (x=1.48) */}
        <mesh position={[1.48, cylinderBottom + 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.14, 24]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function FirstLawThermodynamicsGamePage({
  difficulty = "level1",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Screen state navigation: "mission" -> "instructions" -> "lab"
  const [screenState, setScreenState] = useState<"mission" | "instructions" | "lab">("mission");

  // Explanation & Result Modals
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState<boolean>(false);
  const [incorrectFeedback, setIncorrectFeedback] = useState<string>("");

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Thermodynamic System State
  // --------------------------------------------------------------------------
  const initialU = 1000; // Baseline Internal Energy (J)
  const targetDeltaU = 375; // Target Change in Internal Energy: ΔU = +375 J

  const [heatAdded, setHeatAdded] = useState<number>(0); // q in Joules
  const [workDone, setWorkDone] = useState<number>(0); // W in Joules (work done BY gas)
  const [selectedAction, setSelectedAction] = useState<"addHeat" | "removeHeat" | "expand" | "compress">("addHeat");
  const [selectedDose, setSelectedDose] = useState<number>(100); // Heat: 100, 200, 500; Work: 10, 25

  // Available doses dynamically adjust based on whether action is Heat (q) or Work (W)
  const isWorkAction = selectedAction === "expand" || selectedAction === "compress";
  const availableDoses = useMemo(() => {
    return isWorkAction ? [10, 25] : [100, 200, 500];
  }, [isWorkAction]);

  // Keep selectedDose valid when switching between Heat and Work
  const handleSelectAction = (action: "addHeat" | "removeHeat" | "expand" | "compress") => {
    setSelectedAction(action);
    const willBeWork = action === "expand" || action === "compress";
    if (willBeWork) {
      setSelectedDose(25);
    } else {
      setSelectedDose(100);
    }
  };

  // Burner visual feedback timer states
  const [isHeatingVisual, setIsHeatingVisual] = useState<boolean>(false);
  const [isCoolingVisual, setIsCoolingVisual] = useState<boolean>(false);
  const heatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coolTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const victoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // First Law of Thermodynamics: ΔU = q - W
  const deltaU = useMemo(() => {
    return heatAdded - workDone;
  }, [heatAdded, workDone]);

  const currentU = useMemo(() => {
    return initialU + deltaU;
  }, [initialU, deltaU]);

  // Piston Position: baseline Y = 0.5 (-1.45 to +1.8)
  // When gas expands (work done BY gas, W > 0), piston rises.
  // When gas compresses (work done ON gas, W < 0), piston lowers.
  const pistonHeight = useMemo(() => {
    const baselineY = 0.45;
    // Map workDone (-500J to +800J) to piston displacement (-0.7 to +0.9)
    const displacement = (workDone / 500) * 0.65;
    return Math.max(-0.45, Math.min(1.45, baselineY + displacement));
  }, [workDone]);

  // Gas particle speed scales with internal energy U
  const particleSpeedMultiplier = useMemo(() => {
    return Math.max(0.5, Math.min(2.5, currentU / initialU));
  }, [currentU, initialU]);

  // Calculated Pressure (Ideal Gas Approximation: P ∝ U / V)
  const pressure = useMemo(() => {
    const volumeFactor = 1.0 + (pistonHeight - 0.45) * 0.7;
    const tempFactor = currentU / initialU;
    return Math.max(0.4, Math.min(3.5, 1.0 * (tempFactor / Math.max(0.4, volumeFactor))));
  }, [currentU, initialU, pistonHeight]);

  // Initial random distribution of 24 gas particles
  const particles = useMemo<Particle3DData[]>(() => {
    const list: Particle3DData[] = [];
    for (let i = 0; i < 24; i++) {
      const radiusDist = Math.random() * 1.0;
      const angle = Math.random() * Math.PI * 2;
      list.push({
        id: `p-${i}`,
        pos: new THREE.Vector3(
          Math.cos(angle) * radiusDist,
          -1.2 + Math.random() * 1.2,
          Math.sin(angle) * radiusDist
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 1.2
        ).normalize(),
      });
    }
    return list;
  }, []);

  // Universal Exit Handler
  const handleExitClick = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  // Perform Selected Thermodynamic Action and auto-verify target ΔU
  const handleApplyAction = () => {
    let nextHeat = heatAdded;
    let nextWork = workDone;

    if (selectedAction === "addHeat") {
      nextHeat = heatAdded + selectedDose;
      setHeatAdded(nextHeat);
      setIsCoolingVisual(false);
      setIsHeatingVisual(true);
      if (heatTimerRef.current) clearTimeout(heatTimerRef.current);
      heatTimerRef.current = setTimeout(() => setIsHeatingVisual(false), 2000);
      setNotification(`🔥 Added ${selectedDose} J of Heat (q = +${selectedDose} J) to the gas.`);
    } else if (selectedAction === "removeHeat") {
      nextHeat = heatAdded - selectedDose;
      setHeatAdded(nextHeat);
      setIsHeatingVisual(false);
      setIsCoolingVisual(true);
      if (coolTimerRef.current) clearTimeout(coolTimerRef.current);
      coolTimerRef.current = setTimeout(() => setIsCoolingVisual(false), 2000);
      setNotification(`❄️ Removed ${selectedDose} J of Heat (q = -${selectedDose} J) from the gas.`);
    } else if (selectedAction === "expand") {
      nextWork = workDone + selectedDose;
      setWorkDone(nextWork);
      setNotification(`⬆️ Gas expands! Work done BY gas W = +${selectedDose} J (System loses energy).`);
    } else if (selectedAction === "compress") {
      nextWork = workDone - selectedDose;
      setWorkDone(nextWork);
      setNotification(`⬇️ Piston compressed! Work done ON gas W = -${selectedDose} J (System gains energy).`);
    }

    setTimeout(() => setNotification(null), 3500);

    // Automatically show Victory Modal 1 second after target internal energy change is reached
    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    if (nextHeat - nextWork === targetDeltaU) {
      victoryTimerRef.current = setTimeout(() => {
        setShowVictoryModal(true);
      }, 1000);
    }
  };

  // Verify Current Internal Energy against Target
  const handleCheckAnswer = () => {
    if (deltaU === targetDeltaU) {
      setShowVictoryModal(true);
    } else {
      if (deltaU < targetDeltaU) {
        setIncorrectFeedback(
          `Current ΔU is ${deltaU > 0 ? "+" : ""}${deltaU} J, which is BELOW the target of +${targetDeltaU} J. Remember ΔU = q - W. Try adding more Heat (+q) or compressing the piston (-W)!`
        );
      } else {
        setIncorrectFeedback(
          `Current ΔU is +${deltaU} J, which is ABOVE the target of +${targetDeltaU} J. Remember ΔU = q - W. Try having the gas do more Work (+W by expanding) or remove Heat (-q)!`
        );
      }
      setShowIncorrectModal(true);
    }
  };

  const handleReset = () => {
    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    setHeatAdded(0);
    setWorkDone(0);
    setSelectedAction("addHeat");
    setSelectedDose(100);
    setShowVictoryModal(false);
    setShowIncorrectModal(false);
    setNotification("Reset to initial state (q = 0 J, W = 0 J, ΔU = 0 J).");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-white text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200/80 shadow-2xl">
      {/* ──────────────────────────────────────────────────────────────────
          MAIN CONTAINER: Landscape Single Div
          ────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">

        {/* ================================================================== */}
        {/* SCREEN 1: MISSION SCREEN                                            */}
        {/* ================================================================== */}
        {screenState === "mission" && (
          <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
            <div className="w-full flex items-center justify-between z-10 shrink-0">
              <button
                type="button"
                onClick={handleExitClick}
                className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>EXIT</span>
              </button>
            </div>

            <div className="max-w-2xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
                <span className="text-[#0284C7]">MISSION:</span> Control heat transfer (<span className="font-mono text-sky-800">q</span>) and work (<span className="font-mono text-sky-800">W</span>) to achieve target internal energy change <span className="font-mono text-amber-600">ΔU = +375 J</span>!
              </h1>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setScreenState("instructions")}
                  className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 inline-flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>


          </div>
        )}

        {/* ================================================================== */}
        {/* SCREEN 2: INSTRUCTIONS SCREEN                                       */}
        {/* ================================================================== */}
        {screenState === "instructions" && (
          <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
            <div className="w-full flex items-center justify-between z-10 shrink-0">
              <button
                type="button"
                onClick={handleExitClick}
                className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>EXIT</span>
              </button>

              <div className="flex items-center gap-2 mt-2 sm:mt-3">
                <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
                <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] sm:text-xs tracking-wider uppercase shadow-xs">
                  INSTRUCTIONS TO PLAY
                </div>
                <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
              </div>

              <div className="w-16" />
            </div>

            {/* 3 Step Guidance Cards */}
            <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1 mt-1 sm:mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">

                {/* Card 1: Heat & Work Controls */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Transfer Heat &amp; Work
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Choose to add or remove heat, or move the piston to expand or compress the gas system.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions_firstlaw_step1.png"
                      alt="Heat and Work Controls"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 2: Observe Piston & Gas Particles */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Observe Cylinder Response
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Watch the gas particles speed up or slow down while the piston moves and pressure adjusts.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/first_law_step2_chamber.png"
                      alt="Gas Cylinder Chamber"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 3: Live Energy Meter & Apply */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Check Your Answer
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Track the energy meter as it balances heat and work, then tap Apply to reach the target ΔU.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions_firstlaw_step3.png"
                      alt="First Law Energy Meter HUD"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions: Closer together */}
            <div className="w-full flex items-center justify-center gap-4 max-w-md mx-auto pt-3 z-10 shrink-0">
              <button
                type="button"
                onClick={() => setScreenState("mission")}
                className="flex items-center gap-1.5 h-8 sm:h-9 px-5 sm:px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>BACK</span>
              </button>

              <button
                type="button"
                onClick={() => setScreenState("lab")}
                className="flex items-center gap-1.5 h-8 sm:h-9 px-6 sm:px-7 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* SCREEN 3: INTERACTIVE 3D SIMULATION LAB                             */}
        {/* ================================================================== */}
        {/* Header: Exit Button on Left, Explanation on Right */}
        <div className="w-full flex items-center justify-between px-3 sm:px-6 pt-3 pb-1 shrink-0 z-20 bg-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScreenState("instructions")}
              className="flex items-center gap-1 h-7 sm:h-8 px-3 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>EXIT</span>
            </button>

            {/* Target Status Badge */}
            <div className="hidden xs:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <span className="text-slate-400 font-mono text-[11px]">GOAL:</span>
              <span className="font-mono text-amber-700 font-bold">ΔU = q - W = +375 J</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowExplanationModal(true)}
            className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-200" />
            <span className="inline">EXPLANATION</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN 3D CANVAS VIEW
            ══════════════════════════════════════════════════════════════════ */}
        <div className="relative flex-1 w-full overflow-hidden bg-white">
          {/* Notification Banner */}
          {notification && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white font-semibold text-xs py-1 px-4 rounded-full shadow-md border border-slate-700 animate-in fade-in duration-150 max-w-lg text-center">
              {notification}
            </div>
          )}

          {/* Three.js Canvas: Cylinder, Piston, Particles, Burner & Pressure Gauge */}
          <Canvas
            className="w-full h-full"
            camera={{ position: [0, 1.35, 13.2], fov: 33 }}
            gl={{ antialias: true, alpha: true }}
            shadows
          >
            <ambientLight intensity={1.15} />
            <directionalLight position={[4, 8, 4]} intensity={1.6} castShadow />
            <directionalLight position={[-4, -3, -3]} intensity={0.6} color="#BAE6FD" />

            <Suspense fallback={null}>
              <group position={[0, 0.40, 0]}>
                <CylinderPistonAssembly
                  pistonHeight={pistonHeight}
                  isHeating={isHeatingVisual}
                  isCooling={isCoolingVisual}
                  pressure={pressure}
                />
                {particles.map((p) => (
                  <GasParticleMesh
                    key={p.id}
                    data={p}
                    pistonHeight={pistonHeight}
                    speedMultiplier={particleSpeedMultiplier}
                  />
                ))}
              </group>
            </Suspense>

            <OrbitControls
              target={[0, 0.40, 0]}
              enablePan={false}
              minDistance={6.0}
              maxDistance={16.0}
              maxPolarAngle={Math.PI / 2 + 0.1}
              minPolarAngle={Math.PI / 4}
            />
          </Canvas>

          {/* Digital Live Energy Meter HUD Box - Horizontal Layout */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[420px] bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-xl space-y-1.5 animate-in fade-in duration-200">

            <div className="flex justify-start items-center border-b border-slate-100 pb-1">
              <div className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-extrabold text-[9px] sm:text-[10px] text-slate-800 tracking-wider uppercase">
                  FIRST LAW ENERGY METER
                </span>
              </div>
            </div>

            {/* Horizontal Row: Digital Display on Left, Apply Button on Right */}
            <div className="flex items-stretch gap-2">
              {/* Digital Display Box */}
              <div className="flex-1 bg-[#0B132B] rounded-xl px-3 py-1.5 text-center text-white border border-slate-800 shadow-inner flex flex-col justify-center">
                <div className="font-mono font-black text-base sm:text-lg text-amber-400 tracking-tight leading-none py-1">
                  {deltaU >= 0 ? `+${deltaU}` : deltaU} J
                </div>
              </div>

              {/* APPLY BUTTON (Replaces CHECK ANSWER) */}
              <button
                type="button"
                onClick={handleApplyAction}
                className="w-36 sm:w-40 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 transform hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Zap className="w-4 h-4 text-sky-200 shrink-0" />
                <span>APPLY {selectedDose} J</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BOTTOM CONTROL DOCK (Action Selector Only)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="w-full bg-white border-t border-slate-100 px-3 sm:px-6 py-3 z-30 shrink-0 flex justify-center">
          <div className="flex items-center justify-center max-w-4xl w-full">

            {/* Action Selector Buttons */}
            <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-1 p-1.5 sm:p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSelectAction("addHeat")}
                className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${selectedAction === "addHeat"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span>+ Heat (q &gt; 0)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAction("removeHeat")}
                className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${selectedAction === "removeHeat"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Snowflake className="w-3.5 h-3.5 shrink-0" />
                <span>- Heat (q &lt; 0)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAction("expand")}
                className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${selectedAction === "expand"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5 shrink-0" />
                <span>Expand (W &gt; 0)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAction("compress")}
                className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${selectedAction === "compress"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5 shrink-0" />
                <span>Compress (W &lt; 0)</span>
              </button>
            </div>

          </div>
        </div>

        {/* ================================================================== */}
        {/* MODAL 1: VICTORY MODAL                                              */}
        {/* ================================================================== */}
        {showVictoryModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-2.5 sm:space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-6 h-6 animate-bounce" />
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  CHALLENGE COMPLETED
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  First Law Verified!
                </h2>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Heat Added (<span className="font-mono">q</span>):</span>
                  <span className="font-mono font-bold text-slate-900">{heatAdded >= 0 ? `+${heatAdded}` : heatAdded} J</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Work Done by Gas (<span className="font-mono">W</span>):</span>
                  <span className="font-mono font-bold text-slate-900">{workDone >= 0 ? `+${workDone}` : workDone} J</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-emerald-800 font-bold">
                  <span>ΔU = q - W:</span>
                  <span className="font-mono text-xs sm:text-sm font-black">+{deltaU} J (TARGET ACHIEVED!)</span>
                </div>
              </div>

              <p className="text-slate-600 text-[11px] sm:text-xs leading-snug">
                By supplying <strong>{heatAdded} J</strong> of heat and allowing the gas to perform <strong>{workDone} J</strong> of work through expansion, the internal energy increased by exactly <strong>{deltaU} J</strong>!
              </p>

              <div className="pt-1 flex gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>REPLAY</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExplanationModal(true)}
                  className="flex-1 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 transform hover:scale-[1.02] active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-200" />
                  <span>EXPLANATION</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL 2: INCORRECT / ADAPTIVE FEEDBACK MODAL                       */}
        {/* ================================================================== */}
        {showIncorrectModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-600">
                  ENERGY BALANCE CHECK
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Target Not Yet Reached
                </h2>
              </div>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 text-left">
                {incorrectFeedback}
              </p>

              <div className="pt-1 flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setShowIncorrectModal(false)}
                  className="flex-1 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>TRY AGAIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExplanationModal(true)}
                  className="flex-1 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 transform hover:scale-[1.02] active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-200" />
                  <span>EXPLANATION</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL 3: EXPLANATION GUIDE MODAL (NON-BOXED EDITORIAL ARTICLE)      */}
        {/* ================================================================== */}
        {showExplanationModal && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0284C7]" />
                <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                  First Law of Thermodynamics Guide
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-10 sm:py-7 space-y-6 sm:space-y-8 text-sm sm:text-base text-slate-800 leading-relaxed font-sans w-full">

              {/* Section 1: The First Law of Thermodynamics */}
              <div className="space-y-3 border-b border-slate-200/80 pb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
                  <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                    1. The First Law: Conservation of Energy
                  </h3>
                </div>
                <p className="text-slate-700">
                  Energy can neither be created nor destroyed; it can only change from one form to another. For a thermodynamic closed system, the change in <strong>Internal Energy (ΔU)</strong> equals the net heat transferred into the system minus the work done by the system:
                </p>
                <div className="py-2 text-center font-mono font-black text-base sm:text-lg text-sky-900 tracking-wide">
                  ΔU = q - W
                </div>
                <ul className="space-y-2 text-slate-700 list-disc list-inside pl-1 pt-1">
                  <li><strong>ΔU (Change in Internal Energy):</strong> The total kinetic and potential energy of all gas molecules.</li>
                  <li><strong>q (Heat Transfer):</strong> Energy transferred due to a temperature gradient.</li>
                  <li><strong>W (Work):</strong> Mechanical energy transferred when the gas pushes the piston or is compressed.</li>
                </ul>
              </div>

              {/* Section 2: Sign Conventions in Chemistry */}
              <div className="space-y-3 border-b border-slate-200/80 pb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
                  <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                    2. Thermodynamic Sign Conventions
                  </h3>
                </div>
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-blue-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-blue-900">
                    Heat (q):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                    <li><strong>q &gt; 0 (Endothermic / Heat Added):</strong> Energy enters the gas, increasing internal energy.</li>
                    <li><strong>q &lt; 0 (Exothermic / Heat Removed):</strong> Energy leaves the gas, decreasing internal energy.</li>
                  </ul>
                </div>
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-purple-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-purple-900">
                    Work (W):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                    <li><strong>W &gt; 0 (Expansion):</strong> The gas expands and pushes the piston outward. The gas does work on the surroundings and loses energy (minus W).</li>
                    <li><strong>W &lt; 0 (Compression):</strong> An external force pushes the piston inward. Work is done on the gas, adding energy to the system.</li>
                  </ul>
                </div>
              </div>

              {/* Section 3: What each control does in the Lab */}
              <div className="space-y-5 border-b border-slate-200/80 pb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
                  <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                    3. Lab Controls Guide
                  </h3>
                </div>

                {/* 1. Add Heat */}
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-orange-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-orange-900">
                    1. + Heat (q &gt; 0)
                  </h4>
                  <p className="text-slate-700">
                    Ignites the bottom burner and transfers thermal energy directly into the gas. Gas molecules speed up and internal energy rises.
                  </p>
                </div>

                {/* 2. Remove Heat */}
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-blue-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-blue-900">
                    2. - Heat (q &lt; 0)
                  </h4>
                  <p className="text-slate-700">
                    Cools the base platform, drawing thermal energy out. Gas molecules slow down and internal energy drops.
                  </p>
                </div>

                {/* 3. Expand Piston */}
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-purple-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-purple-900">
                    3. Expand Piston (W &gt; 0)
                  </h4>
                  <p className="text-slate-700">
                    Allows the gas to push the piston upward, performing positive mechanical work. Energy is spent to move the piston, lowering ΔU.
                  </p>
                </div>

                {/* 4. Compress Piston */}
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-teal-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-teal-900">
                    4. Compress Piston (W &lt; 0)
                  </h4>
                  <p className="text-slate-700">
                    Pushes the piston downward, compressing the gas volume. Mechanical work is done onto the gas, raising internal energy and pressure.
                  </p>
                </div>
              </div>

              {/* Section 4: Quick Summary Table */}
              <div className="space-y-3 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
                  <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                    Quick Summary Table
                  </h3>
                </div>

                <div className="overflow-x-auto w-full pt-1">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-slate-900 font-black">
                        <th className="py-2.5 pr-4">Action</th>
                        <th className="py-2.5 px-4">q (Heat)</th>
                        <th className="py-2.5 px-4">W (Work)</th>
                        <th className="py-2.5 pl-4">Effect on ΔU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="py-3 pr-4 font-bold text-orange-700">+ Add Heat</td>
                        <td className="py-3 px-4 font-mono font-bold text-orange-700">q &gt; 0</td>
                        <td className="py-3 px-4 font-mono text-slate-400">0</td>
                        <td className="py-3 pl-4 font-bold text-emerald-700">ΔU Increases (ΔU &gt; 0)</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-blue-700">- Remove Heat</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">q &lt; 0</td>
                        <td className="py-3 px-4 font-mono text-slate-400">0</td>
                        <td className="py-3 pl-4 font-bold text-rose-700">ΔU Decreases (ΔU &lt; 0)</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-purple-700">Expand Piston</td>
                        <td className="py-3 px-4 font-mono text-slate-400">0</td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">W &gt; 0 (By gas)</td>
                        <td className="py-3 pl-4 font-bold text-rose-700">ΔU Decreases (-W)</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-teal-700">Compress Piston</td>
                        <td className="py-3 px-4 font-mono text-slate-400">0</td>
                        <td className="py-3 px-4 font-mono font-bold text-teal-700">W &lt; 0 (On gas)</td>
                        <td className="py-3 pl-4 font-bold text-emerald-700">ΔU Increases (-(-W) = +W)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Bottom Button */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex justify-center shrink-0">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                RESUME SIMULATION
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

