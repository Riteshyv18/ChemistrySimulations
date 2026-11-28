"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Text,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  XCircle,
  BookOpen,
  X,
  Gauge,
  Compass,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ============================================================================
// 3D MOLECULE & CHAMBER COMPONENTS
// ============================================================================

interface MoleculeVisualProps {
  type: "A2" | "B2" | "AB";
  rotationZ: number; // in radians
  isVibrating?: boolean;
}

// Reactant A2 (Red diatomic atoms: labeled "A")
function MoleculeA2({ rotationZ }: { rotationZ: number }) {
  return (
    <group rotation={[0, 0, rotationZ]}>
      {/* Central Bond Cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Atom 1 (Red with 'A' label) */}
      <mesh position={[-0.35, 0, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#EF4444"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      <group position={[-0.35, 0, 0.32]} rotation={[0, 0, -rotationZ]}>
        <Text
          fontSize={0.22}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          renderOrder={10}
          depthOffset={-1}
        >
          A
        </Text>
      </group>

      {/* Atom 2 (Red with 'A' label) */}
      <mesh position={[0.35, 0, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#DC2626"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      <group position={[0.35, 0, 0.32]} rotation={[0, 0, -rotationZ]}>
        <Text
          fontSize={0.22}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          renderOrder={10}
          depthOffset={-1}
        >
          A
        </Text>
      </group>
    </group>
  );
}

// Reactant B2 (Blue diatomic atoms: labeled "B")
function MoleculeB2({ rotationZ }: { rotationZ: number }) {
  return (
    <group rotation={[0, 0, rotationZ]}>
      {/* Central Bond Cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Atom 1 (Blue with 'B' label) */}
      <mesh position={[-0.35, 0, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#3B82F6"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      <group position={[-0.35, 0, 0.32]} rotation={[0, 0, -rotationZ]}>
        <Text
          fontSize={0.22}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          renderOrder={10}
          depthOffset={-1}
        >
          B
        </Text>
      </group>

      {/* Atom 2 (Blue with 'B' label) */}
      <mesh position={[0.35, 0, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#2563EB"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      <group position={[0.35, 0, 0.32]} rotation={[0, 0, -rotationZ]}>
        <Text
          fontSize={0.22}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          renderOrder={10}
          depthOffset={-1}
        >
          B
        </Text>
      </group>
    </group>
  );
}

// Product Molecule AB (Heteronuclear: Red Atom 'A' bonded to Blue Atom 'B')
function MoleculeAB() {
  return (
    <group>
      {/* Chemical Bond connecting Atom A and Atom B */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.52, 16]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.2} metalness={0.4} />
      </mesh>
      {/* Red Atom (A) */}
      <mesh position={[-0.26, 0, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#EF4444"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      <Text
        position={[-0.26, 0, 0.28]}
        fontSize={0.22}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        A
      </Text>

      {/* Blue Atom (B) */}
      <mesh position={[0.26, 0, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#3B82F6"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      <Text
        position={[0.26, 0, 0.28]}
        fontSize={0.22}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        B
      </Text>
    </group>
  );
}

// Modern Rectangular Reaction Chamber for Reactants & Products
function RectangularChamber() {
  return (
    <group position={[0, 0.22, 0]}>
      {/* Outer Chamber Base Plate */}
      <mesh position={[0, -0.68, 0]}>
        <boxGeometry args={[4.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Top Ceiling Plate */}
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[4.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Clean Glass Enclosure Box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.12, 1.28, 1.32]} />
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

      {/* Modern Sleek Metallic Frame Outlines */}
      {/* Left/Right Frame Borders */}
      <mesh position={[-2.06, 0, 0]}>
        <boxGeometry args={[0.04, 1.28, 1.32]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[2.06, 0, 0]}>
        <boxGeometry args={[0.04, 1.28, 1.32]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Subtle floor grid inside chamber */}
      <gridHelper
        args={[4.0, 8, "#94A3B8", "#E2E8F0"]}
        position={[0, -0.63, 0]}
      />

      {/* Central Collision Target Indicator on Floor */}
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// Collision Flash Sparkle Effect
function ReactionFlash({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (active) {
      meshRef.current.scale.lerp(new THREE.Vector3(2.5, 2.5, 2.5), 0.15);
    } else {
      meshRef.current.scale.set(0.001, 0.001, 0.001);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#FDE047" transparent opacity={active ? 0.7 : 0} />
    </mesh>
  );
}

// Main 3D Kinetic Scene
function KineticScene({
  rotA,
  rotB,
  launchProgress,
  isReactionSuccess,
  collisionState,
}: {
  rotA: number;
  rotB: number;
  launchProgress: number; // 0 (idle) to 1 (collision) to 2 (separated)
  isReactionSuccess: boolean;
  collisionState: "idle" | "approaching" | "impact" | "separated";
}) {
  const showProducts = isReactionSuccess && launchProgress > 1;

  // Reactants A2 (Red) and B2 (Blue) during approach:
  // Positioned closer together at start (x = -1.05 and x = +1.05 instead of ±1.5)
  // Shifted upward along y to y = +0.22 to match the upward rectangular chamber
  const posA = useMemo(() => {
    if (launchProgress <= 1) {
      const x = -1.05 + launchProgress * 0.70;
      return [x, 0.22, 0] as [number, number, number];
    } else {
      // Ineffective collision: rebound back to the left
      const after = launchProgress - 1;
      return [-0.35 - after * 0.70, 0.22, 0] as [number, number, number];
    }
  }, [launchProgress]);

  const posB = useMemo(() => {
    if (launchProgress <= 1) {
      const x = 1.05 - launchProgress * 0.70;
      return [x, 0.22, 0] as [number, number, number];
    } else {
      // Ineffective collision: rebound back to the right
      const after = launchProgress - 1;
      return [0.35 + after * 0.70, 0.22, 0] as [number, number, number];
    }
  }, [launchProgress]);

  // Two Product AB molecules after successful reaction:
  // Product 1 AB (Top product) rests centered at y = +0.22 + 0.28
  const posProduct1 = useMemo(() => {
    const after = Math.min(1, Math.max(0, launchProgress - 1));
    return [0, 0.22 + 0.28 * after, 0] as [number, number, number];
  }, [launchProgress]);

  // Product 2 AB (Bottom product) rests centered at y = +0.22 - 0.28
  const posProduct2 = useMemo(() => {
    const after = Math.min(1, Math.max(0, launchProgress - 1));
    return [0, 0.22 - 0.28 * after, 0] as [number, number, number];
  }, [launchProgress]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4.6]} fov={34} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-5, 4, -3]} intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={collisionState === "impact" ? 3 : 0.2} color="#FDE047" />

      {/* Subtle floor grid only for spatial orientation */}
      <gridHelper
        args={[8, 16, "#E2E8F0", "#F1F5F9"]}
        position={[0, -1.1, 0]}
      />

      {/* Rectangular Reaction Chamber Enclosure */}
      <RectangularChamber />

      <ReactionFlash active={collisionState === "impact" && isReactionSuccess} />

      {/* BEFORE REACTION (or upon Ineffective Rebound): show Reactants A2 and B2 */}
      {!showProducts && (
        <>
          <group position={posA}>
            <MoleculeA2 rotationZ={rotA} />
          </group>
          <group position={posB}>
            <MoleculeB2 rotationZ={rotB} />
          </group>
        </>
      )}

      {/* AFTER SUCCESSFUL REACTION: show the two newly formed AB product molecules */}
      {showProducts && (
        <>
          <group position={posProduct1}>
            <MoleculeAB />
          </group>
          <group position={posProduct2}>
            <MoleculeAB />
          </group>
        </>
      )}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.9}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
      />
    </>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CollisionTheoryLevel1GamePage({
  difficulty = "easy",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Screen States: "mission" -> "instructions" -> main game
  const [introStep, setIntroStep] = useState<"mission" | "instructions">("mission");
  const [gameStarted, setGameStarted] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Reaction Controls
  // Orientation angles in degrees (0 to 360) - Initial start angles 45° and 180°
  const [angleA, setAngleA] = useState<number>(45);
  const [angleB, setAngleB] = useState<number>(180);
  // Speed / Kinetic Energy (20 to 100). Activation Energy threshold is 60.
  const [speed, setSpeed] = useState<number>(40);
  const ACTIVATION_ENERGY_THRESHOLD = 60;

  // Collision Animation States
  const [collisionState, setCollisionState] = useState<
    "idle" | "approaching" | "impact" | "separated"
  >("idle");
  const [launchProgress, setLaunchProgress] = useState<number>(0);
  const [collisionResult, setCollisionResult] = useState<{
    hasRun: boolean;
    success: boolean;
    reason: string;
  }>({ hasRun: false, success: false, reason: "" });

  // Score & Attempts tracking (Target: 5 successful collisions)
  const TARGET_SUCCESS_COUNT = 5;
  const [successfulCollisions, setSuccessfulCollisions] = useState<number>(0);
  // Score & Attempts tracking (Single successful effective collision required)
  const [hasSucceeded, setHasSucceeded] = useState<boolean>(false);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [showFailModal, setShowFailModal] = useState<boolean>(false);
  const [pendingOutcome, setPendingOutcome] = useState<"success" | "fail" | null>(null);

  // Check orientation correctness:
  // Both molecules collinear vertical (approx 90° or 270°) allows direct head-on collision of reactive atom centers
  const isOrientationCorrect = useMemo(() => {
    const normA = (Math.abs(angleA) % 180);
    const normB = (Math.abs(angleB) % 180);
    // Tolerance within 30 degrees of 90° (i.e. between 60° and 120°)
    const okA = normA >= 60 && normA <= 120;
    const okB = normB >= 60 && normB <= 120;
    return okA && okB;
  }, [angleA, angleB]);

  const hasSufficientEnergy = speed >= ACTIVATION_ENERGY_THRESHOLD;
  const isCollisionEffective = isOrientationCorrect && hasSufficientEnergy;

  // Animation Loop for Launching Collision
  useEffect(() => {
    let animFrame: number;
    if (collisionState === "approaching") {
      const startTime = performance.now();
      const duration = 1200 * (100 / Math.max(speed, 20)); // faster speed = quicker launch

      const step = (now: number) => {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / duration, 1);
        setLaunchProgress(p);

        if (p < 1) {
          animFrame = requestAnimationFrame(step);
        } else {
          // Impact reached
          setCollisionState("impact");
          setTimeout(() => {
            setCollisionState("separated");
          }, 300);
        }
      };
      animFrame = requestAnimationFrame(step);
    } else if (collisionState === "separated") {
      const startTime = performance.now();
      const duration = 1000;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const p = 1 + Math.min(elapsed / duration, 1);
        setLaunchProgress(p);

        if (p < 2) {
          animFrame = requestAnimationFrame(step);
        } else {
          // Finished cycle: record outcome
          const success = isCollisionEffective;
          let reasonText = "";
          if (success) {
            reasonText = "Effective Collision! Old bonds broke & new AB products formed!";
            setHasSucceeded(true);
          } else {
            if (!hasSufficientEnergy && !isOrientationCorrect) {
              reasonText = "Ineffective: Insufficient Energy (below Ea) AND Incorrect Orientation!";
            } else if (!hasSufficientEnergy) {
              reasonText = "Ineffective: Collision speed below Activation Energy (Ea)!";
            } else {
              reasonText = "Ineffective: Wrong orientation! Reactive atoms did not align properly.";
            }
          }

          setTotalAttempts((prev) => prev + 1);
          setCollisionResult({
            hasRun: true,
            success,
            reason: reasonText,
          });
          setPendingOutcome(success ? "success" : "fail");

          if (!success) {
            setCollisionState("idle");
            setLaunchProgress(0);
          }
        }
      };
      animFrame = requestAnimationFrame(step);
    }

    return () => cancelAnimationFrame(animFrame);
  }, [collisionState, isCollisionEffective, hasSufficientEnergy, isOrientationCorrect, speed]);

  // Open Correct or Incorrect modal 2 seconds after collision finishes
  useEffect(() => {
    if (!pendingOutcome) return;
    const timer = setTimeout(() => {
      if (pendingOutcome === "success") {
        setShowVictoryModal(true);
      } else {
        setShowFailModal(true);
      }
      setPendingOutcome(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [pendingOutcome]);

  // Auto-dismiss toast after 2 seconds
  useEffect(() => {
    if (!collisionResult.hasRun) return;
    const timer = setTimeout(() => {
      setCollisionResult({ hasRun: false, success: false, reason: "" });
    }, 2000);
    return () => clearTimeout(timer);
  }, [collisionResult]);

  const handleLaunch = () => {
    if (collisionState !== "idle") return;
    setPendingOutcome(null);
    setShowFailModal(false);
    setCollisionResult({ hasRun: false, success: false, reason: "" });
    setLaunchProgress(0);
    setCollisionState("approaching");
  };

  const handleResetPositions = () => {
    setCollisionState("idle");
    setLaunchProgress(0);
    setCollisionResult({ hasRun: false, success: false, reason: "" });
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

              <span className="text-[#0284C7]">MISSION:</span> Make reactant molecules collide with correct orientation and sufficient speed to produce a successful chemical reaction!
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
          {/* Subtle Molecule Backdrop Accents */}
          <div className="absolute top-3 right-6 pointer-events-none opacity-25 hidden sm:block">
            <svg width="120" height="90" viewBox="0 0 120 90" fill="none" stroke="#0284C7" strokeWidth="1.5">
              <circle cx="20" cy="25" r="5" fill="#38BDF8" />
              <circle cx="60" cy="15" r="6" fill="#38BDF8" />
              <circle cx="100" cy="35" r="5" fill="#38BDF8" />
              <line x1="25" y1="23" x2="54" y2="16" />
              <line x1="66" y1="17" x2="95" y2="33" />
            </svg>
          </div>

          {/* Bottom Aesthetic Wave (Soft Sky Color) */}
          <div className="absolute bottom-0 inset-x-0 h-32 sm:h-44 pointer-events-none opacity-30 z-0">
            <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path
                d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"
                fill="#7DD3FC"
              />
            </svg>
          </div>

          {/* Top Bar: Exit Button & Pill Header */}
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

            {/* Pill Header */}
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

          {/* 3 Step Guidance Cards */}
          <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">
              {/* Card 1: Rotate Molecules */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Rotate Molecules
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Tap the <strong>A₂</strong> and <strong>B₂</strong> buttons to rotate both molecules so they line up.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/kinetics_step1_rotate.png"
                    alt="Molecule Rotation Buttons"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Card 2: Set Speed & Launch */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Set Speed &amp; Launch
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Slide <strong>Speed</strong> past the green threshold dot, then tap <strong>LAUNCH</strong> to collide!
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/kinetics_step2_speed.png"
                    alt="Speed Slider and Launch Button"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Card 3: Form 2 AB Products */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Form 2 AB Products
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Watch the collision in the chamber! When aligned with enough speed, <strong>2 AB</strong> forms.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/kinetics_step3_submit.png"
                    alt="3D Collision Chamber"
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
          <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-3 pb-1 z-30 shrink-0">
            {/* Exit Button */}
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
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
              <Suspense fallback={null}>
                <KineticScene
                  rotA={(angleA * Math.PI) / 180}
                  rotB={(angleB * Math.PI) / 180}
                  launchProgress={launchProgress}
                  isReactionSuccess={isCollisionEffective}
                  collisionState={collisionState}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Feedback Toast Banner After Collision - Placed at the very top header level so it never covers the 2AB products */}
          {collisionResult.hasRun && (!collisionResult.success || collisionState === "separated") && (
            <div className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-30 max-w-md w-[85%] sm:w-[90%] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
              <div className={`py-1.5 px-3 sm:py-2 sm:px-4 rounded-full shadow-lg border text-center flex items-center justify-center gap-2 ${collisionResult.success
                ? "bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-500/10"
                : "bg-red-50/95 border-red-300 text-red-900 shadow-red-500/10"
                }`}>
                {collisionResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="text-[11px] sm:text-xs font-black tracking-tight">{collisionResult.reason}</span>
              </div>
            </div>
          )}

          {/* Bottom Interactive Control Dock */}
          <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pb-2.5 sm:pb-3.5 z-20">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xl border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">

              {/* Controls: Single Clockwise Rotation Pill per Molecule */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={collisionState !== "idle"}
                  onClick={() => setAngleA((prev) => (prev + 45) % 360)}
                  className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Rotate A₂ clockwise (+45°)"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span>A₂</span>
                  <span className="font-mono text-[10.5px] text-slate-500">{angleA}°</span>
                  <span className="text-xs font-black">↻</span>
                </button>

                <button
                  type="button"
                  disabled={collisionState !== "idle"}
                  onClick={() => setAngleB((prev) => (prev + 45) % 360)}
                  className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Rotate B₂ clockwise (+45°)"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>B₂</span>
                  <span className="font-mono text-[10.5px] text-slate-500">{angleB}°</span>
                  <span className="text-xs font-black">↻</span>
                </button>
              </div>

              {/* Controls: Speed / Energy Slider (Threshold on top + green mark at 60) */}
              <div className="flex-1 w-full max-w-xs px-1">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-sky-600" />
                    Speed
                  </span>
                  <span className="text-[9.5px] font-bold text-emerald-600">
                    Ea Threshold (60)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {speed} <span className="text-[10px] text-slate-400">m/s</span>
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs pointer-events-none z-30"
                  />
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    disabled={collisionState !== "idle"}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="relative z-20 w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284C7] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Action Button: Launch only (auto-opens correct/incorrect modal after 2s) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={collisionState !== "idle"}
                  onClick={handleLaunch}
                  className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${collisionState === "idle"
                    ? "bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-600/30 transform hover:scale-105 active:scale-95"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>LAUNCH</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EXPLANATION MODAL (Clean Full-Screen Rounded Modal)
          ══════════════════════════════════════════════════════════════════════ */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white/98 backdrop-blur-md animate-in fade-in duration-150 rounded-3xl sm:rounded-[32px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-white">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Collision Theory &amp; Effective Collisions Guide
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Module 05: Chemical Kinetics • Reaction Rates &amp; Mechanisms
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
            {/* Section 1 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                <span className="text-[#0284C7]">1.</span> What is Collision Theory?
              </h3>
              <p className="text-slate-600">
                In chemistry, for two reactant molecules to react and form new products, they must physically <strong>collide</strong> with each other.
              </p>
              <p className="text-slate-600">
                However, in a real gas or liquid, molecules collide billions of times every second, but only a small fraction of these collisions result in a chemical reaction! The collisions that successfully create products are called <strong>Effective Collisions</strong>.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                <span className="text-[#0284C7]">2.</span> Condition 1: Activation Energy (Ea)
              </h3>
              <p className="text-slate-600">
                Molecules need energy to smash into each other hard enough to break their existing chemical bonds.
              </p>
              <p className="text-slate-600">
                The minimum kinetic energy required for a collision to trigger a reaction is called the <strong>Activation Energy (Ea)</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                <li>If speed is low (Kinetic Energy &lt; Ea) → Molecules bounce apart unchanged (Ineffective Collision).</li>
                <li>If speed is high (Kinetic Energy ≥ Ea) → Bonds break, allowing new bonds to form.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                <span className="text-[#0284C7]">3.</span> Condition 2: Proper Molecular Orientation (Steric Factor)
              </h3>
              <p className="text-slate-600">
                Even if molecules collide with huge speed, they must hit each other in the <strong>correct orientation</strong>.
              </p>
              <p className="text-slate-600">
                In our simulation:
              </p>
              <div className="space-y-2 pl-3 border-l-2 border-slate-200 text-slate-600">
                <div>
                  <strong className="text-slate-800">Correct Orientation (90° and 270°):</strong> When both reactant molecules A₂ and B₂ are aligned vertically at <strong>90°</strong> (or <strong>270°</strong>), their reactive axes match directly. Upon collision, the existing bonds break and two new <strong>2AB</strong> product molecules are created!
                </div>
                <div>
                  <strong className="text-slate-800">Incorrect Orientation (Any Other Angle):</strong> The molecules collide sideways or at a glancing angle. The reactive atoms never meet head-on, and they simply bounce away without reacting.
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                <span className="text-[#0284C7]">4.</span> The Chemical Reaction
              </h3>
              <div className="font-mono font-bold text-sm text-slate-900 bg-slate-50 py-2.5 px-4 rounded-lg border border-slate-200">
                A₂ (Red-Red) + B₂ (Blue-Blue) ⟶ 2 AB (Red-Blue Products)
              </div>
              <p className="text-slate-600 pt-1">
                When both conditions (Energy ≥ Ea and Orientation set to 90° or 270°) are satisfied simultaneously, an activated complex is formed, and product molecules <strong>2AB</strong> are successfully produced!
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-2">
                <span className="text-[#0284C7]">5.</span> How to Win This Simulation
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-600">
                <li>Set collision speed slider to exceed the Activation Energy barrier (Ea Threshold).</li>
                <li>Use the rotation buttons (↻ ↺) to set both A₂ and B₂ angles to <strong>90°</strong> (or <strong>270°</strong>) so reactive atoms are vertically aligned.</li>
                <li>Click <strong>LAUNCH</strong> to trigger the collision.</li>
                <li>When the bonds break and <strong>2AB</strong> products form, click <strong>SUBMIT</strong> to complete the challenge!</li>
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
          VICTORY MODAL (SCORE BREAKDOWN & MASTERY)
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
                Chemical Kinetics Master!
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                You mastered Collision Theory by combining steric orientation with activation energy!
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1 text-left">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600">Score:</span>
                <span className="font-black text-emerald-600 text-xs">100 / 100</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600">Total Attempts:</span>
                <span className="font-black text-slate-800">{totalAttempts}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600">Result:</span>
                <span className="font-black text-emerald-600">
                  Effective (2AB Formed)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setHasSucceeded(false);
                  setTotalAttempts(0);
                  setAngleA(45);
                  setAngleB(180);
                  setSpeed(40);
                  setShowVictoryModal(false);
                  handleResetPositions();
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
          INCORRECT / RETRY MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 max-w-xs w-full text-center space-y-2.5 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <XCircle className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                Ineffective Collision!
              </h2>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Align both molecules vertically (90° or 270°) and set Speed at or above <strong>Ea Threshold (60)</strong>, then tap <strong>LAUNCH</strong>!
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setShowFailModal(false);
                  handleResetPositions();
                }}
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
