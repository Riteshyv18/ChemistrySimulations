"use client";

import React, { useState, useMemo, useRef, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Sparkles,
  Trophy,
  CheckCircle2,
  X,
  Play,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ============================================================================
// CATALYST DATA & DEFINITIONS
// ============================================================================

export interface CatalystOption {
  id: string;
  name: string;
  shortLabel: string;
  type: "none" | "weak" | "optimal" | "inhibitor";
  eaValue: number; // in kJ/mol
  curvePeakY: number; // 3D peak height in the energy profile curve
  tag: string;
  tagColor: string;
  description: string;
  barrierOutcome: "blocked" | "partial" | "success" | "inhibited";
}

const CATALYSTS: CatalystOption[] = [
  {
    id: "none",
    name: "No Catalyst",
    shortLabel: "None",
    type: "none",
    eaValue: 85,
    curvePeakY: 0.9,
    tag: "Uncatalyzed (85 kJ)",
    tagColor: "bg-slate-100 text-slate-700 border-slate-300",
    description: "High natural barrier. Reactants lack sufficient energy and bounce back.",
    barrierOutcome: "blocked",
  },
  {
    id: "catalyst_alpha",
    name: "Catalyst Alpha (Weak)",
    shortLabel: "Cat α",
    type: "weak",
    eaValue: 60,
    curvePeakY: 0.45,
    tag: "Weak (60 kJ)",
    tagColor: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Lowers Ea slightly, but barrier remains too high for efficient conversion.",
    barrierOutcome: "partial",
  },
  {
    id: "catalyst_beta",
    name: "Catalyst Beta (Optimal)",
    shortLabel: "Cat β",
    type: "optimal",
    eaValue: 35,
    curvePeakY: 0.05,
    tag: "Target Met (35 kJ)",
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "Provides an alternative low-energy pathway. Reactants surmount barrier effortlessly!",
    barrierOutcome: "success",
  },
  {
    id: "inhibitor",
    name: "Inhibitor (Poison)",
    shortLabel: "Inhibitor",
    type: "inhibitor",
    eaValue: 110,
    curvePeakY: 1.15,
    tag: "Inhibitor (110 kJ)",
    tagColor: "bg-rose-100 text-rose-800 border-rose-300",
    description: "Blocks reactive sites, increasing activation energy barrier even further.",
    barrierOutcome: "inhibited",
  },
];

const TARGET_EA = 35; // Target Ea value in kJ/mol

// ============================================================================
// 3D MOLECULE & BARRIER COMPONENTS
// ============================================================================

// 3D Diatomic Reactant Molecule A2 (Red)
function MoleculeA2({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Atom 1 */}
      <mesh position={[-0.14, 0, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#EF4444" roughness={0.3} metalness={0.1} />
      </mesh>
      <Text position={[-0.14, 0, 0.15]} fontSize={0.12} color="#FFFFFF" anchorX="center" anchorY="middle">
        A
      </Text>

      {/* Bond */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.28, 16]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.4} />
      </mesh>

      {/* Atom 2 */}
      <mesh position={[0.14, 0, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.1} />
      </mesh>
      <Text position={[0.14, 0, 0.15]} fontSize={0.12} color="#FFFFFF" anchorX="center" anchorY="middle">
        A
      </Text>
    </group>
  );
}

// 3D Diatomic Reactant Molecule B2 (Blue)
function MoleculeB2({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = -Math.sin(state.clock.elapsedTime * 2 + 1) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Atom 1 */}
      <mesh position={[-0.14, 0, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#3B82F6" roughness={0.3} metalness={0.1} />
      </mesh>
      <Text position={[-0.14, 0, 0.15]} fontSize={0.12} color="#FFFFFF" anchorX="center" anchorY="middle">
        B
      </Text>

      {/* Bond */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.28, 16]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.4} />
      </mesh>

      {/* Atom 2 */}
      <mesh position={[0.14, 0, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#2563EB" roughness={0.3} metalness={0.1} />
      </mesh>
      <Text position={[0.14, 0, 0.15]} fontSize={0.12} color="#FFFFFF" anchorX="center" anchorY="middle">
        B
      </Text>
    </group>
  );
}

// 3D Product Molecule AB (Red-Blue hetero-diatomic)
function MoleculeAB({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 1.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Atom A (Red) */}
      <mesh position={[-0.12, 0, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#EF4444" roughness={0.3} />
      </mesh>
      <Text position={[-0.12, 0, 0.15]} fontSize={0.12} color="#FFFFFF" anchorX="center" anchorY="middle">
        A
      </Text>

      {/* Bond */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.24, 16]} />
        <meshStandardMaterial color="#FDE047" roughness={0.3} />
      </mesh>

      {/* Atom B (Blue) */}
      <mesh position={[0.12, 0, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#3B82F6" roughness={0.3} />
      </mesh>
      <Text position={[0.12, 0, 0.15]} fontSize={0.12} color="#FFFFFF" anchorX="center" anchorY="middle">
        B
      </Text>
    </group>
  );
}

// 3D Energy Profile Curve Ribbon
function EnergyProfileCurve({
  peakY,
  color,
  opacity = 0.8,
  dashed = false,
  label,
  eaText,
  showLabel = true,
  labelOffsetY = 0.16,
}: {
  peakY: number;
  color: string;
  opacity?: number;
  dashed?: boolean;
  label: string;
  eaText: string;
  showLabel?: boolean;
  labelOffsetY?: number;
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const steps = 60;
    const startX = -2.2;
    const endX = 2.2;
    const reactantY = -0.6;
    const productY = -0.95; // Exothermic ΔH = -45 kJ/mol

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + t * (endX - startX);

      // Bell curve for Ea barrier connecting reactant level to product level
      const baseline = reactantY * (1 - t) + productY * t;
      const gaussian = Math.exp(-Math.pow((x - 0.05) / 0.85, 2));
      const barrierHeight = peakY - baseline;
      const y = baseline + barrierHeight * gaussian;

      pts.push(new THREE.Vector3(x, y, 0));
    }
    return pts;
  }, [peakY]);

  const curveObject = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 0.024, 8, false);
  }, [points]);

  return (
    <group>
      {/* 3D Tube Curve */}
      <mesh geometry={curveObject}>
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={opacity}
          wireframe={dashed}
        />
      </mesh>

      {/* Peak Indicator Marker & Label */}
      {showLabel && (
        <group position={[0.05, peakY + 0.08, 0]}>
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <Text
            position={[0, labelOffsetY, 0]}
            fontSize={0.12}
            color={color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#0F172A"
          >
            {`${label} (Ea = ${eaText})`}
          </Text>
        </group>
      )}
    </group>
  );
}

// 3D Moving Molecule that attempts to cross the barrier
function TravelingMolecule({
  progress,
  peakY,
  isSuccess,
  isReactionActive,
  hasCompletedSuccess,
}: {
  progress: number; // 0 to 1
  peakY: number;
  isSuccess: boolean;
  isReactionActive: boolean;
  hasCompletedSuccess: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);

  // Calculate position along curve
  const startX = -2.2;
  const endX = 2.0;
  const reactantY = -0.6;
  const productY = -0.95;

  let currentX = startX;
  let currentY = reactantY;

  if (isReactionActive) {
    if (isSuccess) {
      // Smoothly crosses all the way from left (-2.2) to right (2.0)
      currentX = startX + progress * (endX - startX);
      const t = progress;
      const baseline = reactantY * (1 - t) + productY * t;
      const gaussian = Math.exp(-Math.pow((currentX - 0.05) / 0.85, 2));
      const barrierHeight = peakY - baseline;
      currentY = baseline + barrierHeight * gaussian;
    } else {
      // Climbs up to ~halfway of peak then slides back down to reactant side
      const climbProgress = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      const effectiveT = climbProgress * 0.42; // stops before top
      currentX = startX + effectiveT * (endX - startX);
      const baseline = reactantY * (1 - effectiveT) + productY * effectiveT;
      const gaussian = Math.exp(-Math.pow((currentX - 0.05) / 0.85, 2));
      const barrierHeight = peakY - baseline;
      currentY = baseline + barrierHeight * gaussian;
    }
  } else if (hasCompletedSuccess) {
    // Keep 2AB products resting on the right-side products platform
    currentX = 1.9;
    currentY = productY;
  } else {
    // Resting on the left-side reactants platform
    currentX = -1.9;
    currentY = reactantY;
  }

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(currentX, currentY + 0.18, 0.05);
    }
  });

  const hasFormedProducts = hasCompletedSuccess || (isSuccess && progress > 0.65);

  return (
    <group ref={meshRef}>
      {hasFormedProducts ? (
        // Render 2 separate AB product molecules (2 AB)
        <group>
          <MoleculeAB position={[-0.22, 0, 0.08]} />
          <MoleculeAB position={[0.22, 0, -0.08]} />
          <pointLight color="#FBBF24" intensity={1.5} distance={1.2} />
        </group>
      ) : (
        // Render reacting A2 + B2 complex
        <group>
          <MoleculeA2 position={[-0.22, 0, 0]} />
          <MoleculeB2 position={[0.22, 0, 0]} />
          <pointLight color="#38BDF8" intensity={1.0} distance={1.0} />
        </group>
      )}
    </group>
  );
}

// 3D Scene Environment & Platform Layout
function BarrierEnvironmentScene({
  activeCatalyst,
  reactionProgress,
  isReactionActive,
  hasCompletedSuccess,
}: {
  activeCatalyst: CatalystOption;
  reactionProgress: number;
  isReactionActive: boolean;
  hasCompletedSuccess: boolean;
}) {
  const isOptimal = activeCatalyst.type === "optimal";

  return (
    <group position={[0, 0.35, 0]}>
      {/* Reactants Platform (Left Valley) */}
      <group position={[-1.9, -0.8, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.12, 1.2]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.1} />
        </mesh>
        <Text position={[0, -0.18, 0]} fontSize={0.14} color="#0F172A" anchorX="center" anchorY="top">
          REACTANTS (A2 + B2)
        </Text>
        <Text position={[0, -0.36, 0]} fontSize={0.1} color="#64748B" anchorX="center" anchorY="top">
          Initial: 45 kJ/mol
        </Text>
      </group>

      {/* Products Platform (Right Valley) */}
      <group position={[1.9, -1.15, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.12, 1.2]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.1} />
        </mesh>
        <Text position={[0, -0.18, 0]} fontSize={0.14} color="#0F172A" anchorX="center" anchorY="top">
          PRODUCTS (2 AB)
        </Text>
        <Text position={[0, -0.36, 0]} fontSize={0.1} color="#64748B" anchorX="center" anchorY="top">
          Final: 0 kJ/mol
        </Text>
      </group>

      {/* Delta H Indicator Line & Label (Enthalpy Change remains constant) */}
      <group position={[0.7, -0.6, 0.4]}>
        {/* Vertical arrow representing ΔH */}
        <mesh position={[0, -0.175, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
          <meshBasicMaterial color="#94A3B8" />
        </mesh>
        <Text position={[0.22, -0.175, 0]} fontSize={0.12} color="#475569" anchorX="left" anchorY="middle">
          ΔH = -45 kJ/mol (Unchanged)
        </Text>
      </group>

      {/* Baseline Reference Profile: Uncatalyzed Reaction (High Red Hill) */}
      <EnergyProfileCurve
        peakY={0.82}
        color="#EF4444"
        opacity={activeCatalyst.type === "none" ? 0.95 : 0.35}
        dashed={activeCatalyst.type !== "none"}
        label="Uncatalyzed"
        eaText="85 kJ/mol"
        showLabel={true}
        labelOffsetY={activeCatalyst.type === "inhibitor" ? -0.22 : 0.15}
      />

      {/* Active Catalyst Profile (Alternative Pathway) */}
      {activeCatalyst.type !== "none" && (
        <EnergyProfileCurve
          peakY={activeCatalyst.curvePeakY}
          color={
            activeCatalyst.type === "optimal"
              ? "#10B981"
              : activeCatalyst.type === "weak"
              ? "#F59E0B"
              : "#E11D48"
          }
          opacity={0.95}
          dashed={false}
          label={activeCatalyst.name}
          eaText={`${activeCatalyst.eaValue} kJ/mol`}
          showLabel={true}
          labelOffsetY={0.16}
        />
      )}

      {/* Moving Molecule executing reaction attempt */}
      <TravelingMolecule
        progress={reactionProgress}
        peakY={activeCatalyst.curvePeakY}
        isSuccess={isOptimal}
        isReactionActive={isReactionActive}
        hasCompletedSuccess={hasCompletedSuccess}
      />
    </group>
  );
}

// ============================================================================
// MAIN GAME PAGE COMPONENT
// ============================================================================

export default function ActivationEnergyGamePage({
  difficulty: _difficulty,
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Navigation Screens
  const [introStep, setIntroStep] = useState<"mission" | "instructions">("mission");
  const [gameStarted, setGameStarted] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Selected Catalyst State
  const [selectedCatalystId, setSelectedCatalystId] = useState<string>("none");
  const activeCatalyst = useMemo(
    () => CATALYSTS.find((c) => c.id === selectedCatalystId) || CATALYSTS[0],
    [selectedCatalystId]
  );

  // Reaction Animation Execution State
  const [isReactionActive, setIsReactionActive] = useState(false);
  const [reactionProgress, setReactionProgress] = useState(0);
  const [hasCompletedSuccess, setHasCompletedSuccess] = useState(false);

  // Check if target is achieved
  const isTargetAchieved = activeCatalyst.eaValue <= TARGET_EA && activeCatalyst.type === "optimal";

  // Reaction Animation Loop
  useEffect(() => {
    if (!isReactionActive) return;

    let startTime = performance.now();
    const duration = activeCatalyst.type === "optimal" ? 2200 : 1600;
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      setReactionProgress(p);

      if (p < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setIsReactionActive(false);
        if (activeCatalyst.type === "optimal") {
          setHasCompletedSuccess(true);
        }
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isReactionActive, activeCatalyst]);

  const handleActivateReaction = () => {
    if (isReactionActive) return;
    setReactionProgress(0);
    setIsReactionActive(true);
  };

  const handleReset = () => {
    setSelectedCatalystId("none");
    setIsReactionActive(false);
    setReactionProgress(0);
    setHasCompletedSuccess(false);
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
          SCREEN 0: MISSION INTRO SCREEN (Matching single-liner style)
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
              <span className="text-[#0284C7]">MISSION:</span> Use the correct catalyst to break the energy barrier and form products!
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
          SCREEN 1: INSTRUCTIONS TO PLAY (3-Card Layout matching Topics 1 & 2)
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
              {/* Card 1: Energy Profile & High Barrier */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Inspect Energy Profile
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-extrabold text-[9px]">
                      High Barrier (Ea = 85 kJ)
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Observe the high initial red curve separating reactants (A₂ + B₂) on the left from products (2 AB) on the right.
                  </p>
                </div>
                {/* Visual miniature curve representation matching uploaded image 2 */}
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex flex-col justify-between p-2 mt-2 shadow-inner">
                  <div className="text-[8px] font-bold text-center text-red-600">
                    Uncatalyzed (Ea = 85 kJ/mol)
                  </div>
                  <div className="flex items-end justify-between px-2 pb-1 relative">
                    {/* Reactants */}
                    <div className="flex items-center gap-0.5 z-10">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    </div>
                    {/* Curved hill arch */}
                    <div className="absolute inset-x-8 bottom-1.5 h-10 border-t-2 border-red-500 rounded-t-full" />
                    {/* Products marker */}
                    <div className="text-[8px] font-bold text-slate-600 z-10">
                      Products (2 AB)
                    </div>
                  </div>
                  <div className="flex justify-between text-[7.5px] text-slate-400 px-1">
                    <span>Reactants</span>
                    <span>ΔH = -45 kJ</span>
                    <span>Products</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Select Catalyst from Dock */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Choose Catalyst
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px]">
                      Lower Energy Pathway
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Select a catalyst from the dock. An optimal catalyst lowers the activation barrier down to the target!
                  </p>
                </div>
                {/* Visual miniature dock matching uploaded image 3 */}
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center px-2 py-1 mt-2 shadow-inner">
                  <div className="bg-white/95 rounded-xl px-2 py-1.5 border border-slate-200 shadow-xs flex items-center gap-1.5 w-full justify-center">
                    <span className="text-[7.5px] font-black uppercase text-slate-500 flex items-center gap-0.5">
                      <Layers className="w-2.5 h-2.5 text-sky-600" />
                      CATALYST:
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[7.5px] font-bold">
                      None
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[7.5px] font-bold">
                      Cat α
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[7.5px] font-bold">
                      Cat β
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[7.5px] font-bold">
                      Inhibitor
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Activate Reaction & Submit */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Activate &amp; Submit
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[9px]">
                      Test Reaction Passage
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Click Activate to launch molecules over the barrier. When products form, click the green Submit button!
                  </p>
                </div>
                {/* Visual miniature buttons matching uploaded image 4 */}
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center px-2 py-1 mt-2 shadow-inner">
                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-full bg-[#0284C7] text-white text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>ACTIVATE</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                      <RotateCcw className="w-2.5 h-2.5" />
                    </div>
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
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
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
          SCREEN 2: MAIN 3D ACTIVATION ENERGY SIMULATION (Single Canvas Landscape)
          ══════════════════════════════════════════════════════════════════════ */}
      {gameStarted && (
        <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
          {/* Top Bar Header */}
          <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-3 pb-1 z-30 shrink-0">
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

          {/* Right Status Card: Activation Energy Meter (Shifted Upward) */}
          <div className="absolute right-4 sm:right-6 top-16 sm:top-20 z-20 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/90 w-40 text-center space-y-1.5 pointer-events-auto">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Activation Energy (Ea)
                </span>
                <div
                  className={`text-2xl font-black font-mono mt-0.5 ${
                    isTargetAchieved ? "text-emerald-600" : "text-[#0284C7]"
                  }`}
                >
                  {activeCatalyst.eaValue}{" "}
                  <span className="text-xs text-slate-400 font-sans font-bold">kJ/mol</span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    isTargetAchieved ? "bg-emerald-500" : "bg-sky-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(15, ((110 - activeCatalyst.eaValue) / (110 - TARGET_EA)) * 100)
                    )}%`,
                  }}
                />
              </div>

              {/* Target Goal Pill */}
              <div
                className={`py-1 px-2 rounded-xl text-[10px] font-extrabold border ${
                  isTargetAchieved
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {isTargetAchieved ? "✓ Target Met (≤ 35 kJ)" : "Goal: ≤ 35 kJ/mol"}
              </div>
            </div>
          </div>

          {/* 3D WebGL Canvas Layer (Full Screen Single Canvas) */}
          <div className="absolute inset-0 z-0">
            <Canvas gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[0, 0.32, 7.0]} fov={34} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 8, 5]} intensity={1.3} castShadow />
              <directionalLight position={[-5, 4, -3]} intensity={0.6} />
              <pointLight position={[0, 0.4, 0]} intensity={0.5} color="#38BDF8" />

              {/* Floor grid */}
              <gridHelper args={[10, 16, "#E2E8F0", "#F1F5F9"]} position={[0, -0.95, 0]} />

              <Suspense fallback={null}>
                <BarrierEnvironmentScene
                  activeCatalyst={activeCatalyst}
                  reactionProgress={reactionProgress}
                  isReactionActive={isReactionActive}
                  hasCompletedSuccess={hasCompletedSuccess}
                />
              </Suspense>

              <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.9}
                minAzimuthAngle={-Math.PI / 8}
                maxAzimuthAngle={Math.PI / 8}
              />
            </Canvas>
          </div>

          {/* Bottom Interactive Catalyst Control Dock */}
          <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pb-2.5 sm:pb-3.5 z-20">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-6 sm:py-2.5 shadow-xl border border-slate-200/90 flex items-center justify-between gap-4">
              {/* Catalyst Selection Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase text-slate-500 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  Catalyst:
                </span>
                {CATALYSTS.map((cat) => {
                  const isSelected = cat.id === selectedCatalystId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCatalystId(cat.id);
                        setReactionProgress(0);
                        setIsReactionActive(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm scale-102"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"
                      }`}
                    >
                      <span>{cat.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: ACTIVATE / RESET / SUBMIT */}
              <div className="flex items-center gap-2 shrink-0">
                {hasCompletedSuccess ? (
                  <button
                    type="button"
                    onClick={() => setShowVictoryModal(true)}
                    className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SUBMIT</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isReactionActive}
                      onClick={handleActivateReaction}
                      className="px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{isReactionActive ? "TESTING..." : "ACTIVATE"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3.5 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Reset conditions"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
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
                Activation Energy: Break the Barrier Guide
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Module 05: Chemical Kinetics • Catalysts &amp; Energy Profiles
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
            {/* PART 1: CORE SCIENCE CONCEPT */}
            <div className="space-y-3 bg-sky-50/70 p-4 rounded-2xl border border-sky-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                PART 1: CORE SCIENCE CONCEPT
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                What is Activation Energy (Ea)?
              </h3>
              <p className="text-slate-600">
                For chemical bonds to break and form new products, reactant molecules must collide with a minimum threshold of kinetic energy. This energy threshold is the <strong>Activation Energy (Ea)</strong>.
              </p>
            </div>

            {/* Analogy: Mountain Pass vs. Tunnel */}
            <div className="space-y-2 border-l-3 border-emerald-500 pl-3 sm:pl-4">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                The Mountain Pass vs. Tunnel Analogy
              </h4>
              <p className="text-slate-600">
                Imagine driving a car from <strong>Town A (Reactants)</strong> to <strong>Town B (Products)</strong>:
              </p>
              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 text-slate-700 space-y-1.5 my-1">
                <ul className="space-y-1 text-xs">
                  <li>
                    <strong className="text-slate-800">• Without Catalyst (Uncatalyzed):</strong> You must drive all the way over a steep, towering mountain peak (High Ea = 85 kJ/mol). Only cars with massive engine energy can make the climb.
                  </li>
                  <li>
                    <strong className="text-slate-800">• With Catalyst (Catalyzed):</strong> The catalyst carves a <strong>low-altitude tunnel</strong> through the mountain (Low Ea = 35 kJ/mol). Almost every car can cruise through effortlessly!
                  </li>
                </ul>
              </div>
            </div>

            {/* Why Delta H Remains Unchanged */}
            <div className="space-y-2 border-l-3 border-blue-500 pl-3 sm:pl-4">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Catalyst Does NOT Change Enthalpy (ΔH)
              </h4>
              <p className="text-slate-600">
                Notice that the elevation difference between Town A and Town B is strictly fixed:
              </p>
              <div className="font-mono font-bold text-xs sm:text-sm text-blue-900 bg-blue-50 py-2 px-3 rounded-xl border border-blue-200">
                ΔH = Energy(Products) - Energy(Reactants) = Constant (-45 kJ/mol)
              </div>
              <p className="text-slate-600 text-xs">
                A catalyst accelerates both forward and reverse rates by providing an alternative transition state, but it <strong>never</strong> alters reactant energy, product energy, or equilibrium thermodynamics.
              </p>
            </div>

            {/* PART 2: HOW TO PLAY */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-200/80 px-2.5 py-0.5 rounded-full inline-block">
                PART 2: HOW TO PLAY (STEP-BY-STEP)
              </span>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1 text-xs sm:text-sm">
                <li>
                  <strong className="text-slate-800">Observe the Initial Barrier:</strong> At start (No Catalyst), the energy curve peak is at 85 kJ/mol. Clicking <strong>ACTIVATE</strong> shows the molecules bouncing off the steep hill.
                </li>
                <li>
                  <strong className="text-slate-800">Select Catalysts:</strong> In the bottom dock, test different options (Weak α, Optimal β, Inhibitor).
                </li>
                <li>
                  <strong className="text-slate-800">Reach the Target:</strong> Select <strong>Catalyst Beta</strong> to lower the barrier to <strong>Ea = 35 kJ/mol</strong>.
                </li>
                <li>
                  <strong className="text-slate-800">Click Activate &amp; Submit:</strong> Watch the reactant molecules glide across the lowered peak into the product valley forming 2AB, then click the green <strong>SUBMIT</strong> button!
                </li>
              </ol>
            </div>
          </div>

          {/* Bottom Bar: RESUME CHALLENGE Button */}
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
                Barrier Overcome!
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                You selected the optimal catalyst, lowered the activation energy to 35 kJ/mol, and completed the reaction!
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Score:</span>
                <span className="font-black text-emerald-600 text-sm">100 / 100</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Reduced Ea:</span>
                <span className="font-black text-emerald-600">{activeCatalyst.eaValue} kJ/mol (Target Met)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Enthalpy (ΔH):</span>
                <span className="font-black text-slate-800">-45 kJ/mol (Unchanged)</span>
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

