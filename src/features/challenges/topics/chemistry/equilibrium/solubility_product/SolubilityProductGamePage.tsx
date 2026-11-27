"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  X,
  PlusCircle,
  MinusCircle,
  Info,
  CheckCircle2,
  Droplets,
  FlaskConical,
  Gauge,
  ArrowRight,
  AlertCircle,
  Check,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ============================================================================
// TYPES & 3D STRUCTURES (Ag⁺, Cl⁻, AgCl Crystal Lattice)
// ============================================================================

interface Ion3DData {
  id: string;
  type: "Ag" | "Cl";
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpeed: THREE.Euler;
}

interface CrystalParticle {
  id: string;
  pos: THREE.Vector3;
  size: number;
  rot: THREE.Euler;
}

// Spheres & Geometries
const sphereGeoAg = new THREE.SphereGeometry(0.26, 20, 20); // Ag+ (Silver-grey metallic)
const sphereGeoCl = new THREE.SphereGeometry(0.35, 20, 20); // Cl- (Cyan / Emerald Green)
const crystalBoxGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24); // AgCl crystal micro-cube

const matAg = new THREE.MeshStandardMaterial({
  color: "#CBD5E1",
  roughness: 0.2,
  metalness: 0.8,
});

const matCl = new THREE.MeshStandardMaterial({
  color: "#0891B2",
  roughness: 0.25,
  metalness: 0.2,
});

const matCrystal = new THREE.MeshStandardMaterial({
  color: "#F59E0B",
  emissive: "#B45309",
  emissiveIntensity: 0.18,
  roughness: 0.35,
  metalness: 0.2,
});

// Single Ion Renderer with Billboarding Text Label
function IonMesh({ data }: { data: Ion3DData }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Movement within liquid boundary
    data.pos.addScaledVector(data.vel, delta * 1.5);

    // Collision bounces within beaker cylinder (radius ~ 1.7)
    const rSq = data.pos.x * data.pos.x + data.pos.z * data.pos.z;
    if (rSq > 1.45 * 1.45) {
      const normal = new THREE.Vector3(data.pos.x, 0, data.pos.z).normalize();
      data.vel.reflect(normal).multiplyScalar(0.95);
      data.pos.x = normal.x * 1.42;
      data.pos.z = normal.z * 1.42;
    }

    // Top / Bottom liquid boundaries
    if (data.pos.y > 0.45) {
      data.pos.y = 0.45;
      data.vel.y = -Math.abs(data.vel.y);
    } else if (data.pos.y < -1.15) {
      data.pos.y = -1.15;
      data.vel.y = Math.abs(data.vel.y);
    }

    meshRef.current.position.copy(data.pos);
    meshRef.current.rotation.x += data.rotSpeed.x * delta;
    meshRef.current.rotation.y += data.rotSpeed.y * delta;
  });

  return (
    <group ref={meshRef} position={data.pos}>
      {data.type === "Ag" ? (
        <>
          <mesh geometry={sphereGeoAg} material={matAg} castShadow />
          <Text
            position={[0, 0, 0.28]}
            fontSize={0.16}
            color="#0F172A"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#FFFFFF"
            fontWeight="bold"
          >
            Ag⁺
          </Text>
        </>
      ) : (
        <>
          <mesh geometry={sphereGeoCl} material={matCl} castShadow />
          <Text
            position={[0, 0, 0.37]}
            fontSize={0.20}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#083344"
            fontWeight="bold"
          >
            Cl⁻
          </Text>
        </>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D BEAKER, LIQUID, CRYSTAL DEPOSITS, AND ELECTRODE / SENSORS
// ----------------------------------------------------------------------------

function GlassBeaker({
  volume,
  precipitationAmount,
}: {
  volume: number;
  precipitationAmount: number;
}) {
  // Beaker dimensions matching the reference view
  const radius = 1.75;
  const height = 3.3;
  const beakerBottom = -1.45;

  // Liquid level dynamically rises with volume
  const liquidHeight = useMemo(() => {
    return Math.max(1.1, Math.min(2.7, 1.1 + ((volume - 50) / 200) * 1.6));
  }, [volume]);

  const liquidY = beakerBottom + liquidHeight / 2;

  // Opacity of liquid becomes cloudier as precipitation actively increases
  const cloudiness = useMemo(() => {
    return Math.min(0.65, 0.16 + precipitationAmount * 0.08);
  }, [precipitationAmount]);

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Glass Beaker Cylinder */}
      <mesh position={[0, beakerBottom + height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#E2E8F0"
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.88}
          ior={1.48}
          thickness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Glass Beaker Rim */}
      <mesh position={[0, beakerBottom + height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.045, 16, 48]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.1} metalness={0.4} />
      </mesh>

      {/* Glass Beaker Bottom Base */}
      <mesh position={[0, beakerBottom, 0]}>
        <cylinderGeometry args={[radius, radius, 0.08, 48]} />
        <meshPhysicalMaterial
          color="#94A3B8"
          transparent
          opacity={0.55}
          roughness={0.15}
          transmission={0.7}
        />
      </mesh>

      {/* Dynamic Water / Aqueous Solution */}
      <mesh position={[0, liquidY, 0]}>
        <cylinderGeometry args={[radius * 0.98, radius * 0.98, liquidHeight, 36]} />
        <meshStandardMaterial
          color={precipitationAmount > 0.05 ? "#F1F5F9" : "#E0F2FE"}
          transparent
          opacity={cloudiness}
          roughness={0.2}
        />
      </mesh>

      {/* Meniscus Top Surface */}
      <mesh position={[0, beakerBottom + liquidHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.97, 36]} />
        <meshStandardMaterial
          color="#BAE6FD"
          transparent
          opacity={0.45}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      {/* Graduated Measurement Markings on Glass - oriented inward facing viewer */}
      <group position={[0, 0, radius * 0.96]}>
        <Text position={[0, beakerBottom + 0.5, 0]} fontSize={0.10} color="#475569" anchorX="center">
          — 50 mL —
        </Text>
        <Text position={[0, beakerBottom + 1.1, 0]} fontSize={0.10} color="#475569" anchorX="center">
          — 100 mL —
        </Text>
        <Text position={[0, beakerBottom + 1.7, 0]} fontSize={0.10} color="#475569" anchorX="center">
          — 150 mL —
        </Text>
        <Text position={[0, beakerBottom + 2.3, 0]} fontSize={0.10} color="#475569" anchorX="center">
          — 200 mL —
        </Text>
      </group>
    </group>
  );
}

// ----------------------------------------------------------------------------
// SOLID AgCl PRECIPITATE PILE AT THE BOTTOM OF THE BEAKER
// ----------------------------------------------------------------------------
function PrecipitateBed({ amount }: { amount: number }) {
  // Generate a clustered field of micro-crystals at bottom when amount > 0
  const crystals = useMemo(() => {
    const list: { pos: [number, number, number]; rot: [number, number, number]; scale: number }[] = [];
    const count = Math.min(80, Math.round(amount * 22));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 1.35;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = -1.26 + Math.random() * 0.16 * Math.min(2.5, amount * 0.7);
      list.push({
        pos: [x, y, z],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: 0.8 + Math.random() * 0.7,
      });
    }
    return list;
  }, [amount]);

  if (amount <= 0.02) return null;

  return (
    <group>
      {crystals.map((c, i) => (
        <mesh
          key={i}
          position={c.pos}
          rotation={c.rot}
          scale={[c.scale, c.scale, c.scale]}
          geometry={crystalBoxGeo}
          material={matCrystal}
          castShadow
        />
      ))}
    </group>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function SolubilityProductGamePage({
  difficulty = "level1",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Navigation Flow: "mission" | "instructions" | "game"
  const [screenState, setScreenState] = useState<"mission" | "instructions" | "game">("mission");

  // Reagent Dock Controls
  // Reagent Type: "nacl" (Common Cl-) | "water" (Dilute)
  const [reagentType, setReagentType] = useState<"nacl" | "water">("nacl");
  const [isReagentMenuOpen, setIsReagentMenuOpen] = useState<boolean>(false);
  const [dosageMmol, setDosageMmol] = useState<number>(0.1); // 0.1 or 0.5 mmol

  // Chemical State:
  // Initial state: 100 mL of unsaturated AgCl solution
  // [Ag+] = 1.00e-5 M, [Cl-] = 1.00e-5 M => Qsp = 1.00e-10 < Ksp (1.80e-10)
  const KSP = 1.8e-10; // AgCl Ksp at 25 °C

  const [volumeMl, setVolumeMl] = useState<number>(100); // mL
  const [concAg, setConcAg] = useState<number>(1.0e-5); // M (mol/L)
  const [concCl, setConcCl] = useState<number>(1.0e-5); // M (mol/L)
  const [precipitateAmount, setPrecipitateAmount] = useState<number>(0); // Solid deposit starts at 0

  // Feedback, Modals & Notifications
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState<boolean>(false);
  const [incorrectFeedback, setIncorrectFeedback] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  // Compute Qsp = [Ag+] * [Cl-]
  const currentQsp = useMemo(() => {
    return Math.max(1e-16, concAg * concCl);
  }, [concAg, concCl]);

  // Ratio Qsp / Ksp
  const ratio = useMemo(() => {
    return currentQsp / KSP;
  }, [currentQsp]);

  // Dynamic status condition
  const solutionCondition = useMemo(() => {
    if (ratio < 0.98) return "unsaturated";
    if (ratio > 1.02) return "supersaturated";
    return "saturated";
  }, [ratio]);

  // Target Goal: Induce precipitation by adding NaCl so Qsp exceeds Ksp (supersaturated)
  const isTargetAchieved = useMemo(() => {
    return solutionCondition === "supersaturated";
  }, [solutionCondition]);

  // 3D Moving Ions state
  const [ions, setIons] = useState<Ion3DData[]>([]);

  // Update 3D Ions count whenever concentrations change
  useEffect(() => {
    const numAg = Math.min(14, Math.max(2, Math.round((concAg / 1.34e-5) * 5)));
    const numCl = Math.min(14, Math.max(2, Math.round((concCl / 1.34e-5) * 5)));

    const newIons: Ion3DData[] = [];
    let idCounter = 1;

    for (let i = 0; i < numAg; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.35;
      newIons.push({
        id: `Ag-${idCounter++}`,
        type: "Ag",
        pos: new THREE.Vector3(r * Math.cos(theta), -0.7 + Math.random() * 1.3, r * Math.sin(theta)),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        rotSpeed: new THREE.Euler(Math.random() * 1.5, Math.random() * 1.5, 0),
      });
    }

    for (let i = 0; i < numCl; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.35;
      newIons.push({
        id: `Cl-${idCounter++}`,
        type: "Cl",
        pos: new THREE.Vector3(r * Math.cos(theta), -0.7 + Math.random() * 1.3, r * Math.sin(theta)),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        rotSpeed: new THREE.Euler(Math.random() * 1.5, Math.random() * 1.5, 0),
      });
    }

    setIons(newIons);
  }, [concAg, concCl]);

  // --------------------------------------------------------------------------
  // USER ACTIONS: ADD REAGENT
  // --------------------------------------------------------------------------

  const handleAddReagent = () => {
    if (reagentType === "nacl") {
      // Adding common ion Cl-: +2.0e-6 M per 0.1 mmol tap at 100 mL (5 taps: 1.00 -> 2.00 x 10^-10)
      const addedMolesCl = dosageMmol * 2e-6;
      const newConcCl = concCl + addedMolesCl / (volumeMl / 1000);
      setConcCl(newConcCl);
      if (concAg * newConcCl > KSP * 1.02) {
        setPrecipitateAmount((prev) => Math.min(3.5, prev + 0.45));
      }
      setNotification(`➕ Added ${dosageMmol} mmol NaCl (Common Cl⁻)! Ion product Qsp increases.`);
    } else if (reagentType === "water") {
      // Diluting with pure water lowers ion concentrations and dissolves precipitate
      const newVol = Math.min(200, volumeMl + dosageMmol * 20);
      const dilutionFactor = volumeMl / newVol;
      setVolumeMl(newVol);
      setConcAg((prev) => prev * dilutionFactor);
      setConcCl((prev) => prev * dilutionFactor);
      setPrecipitateAmount((prev) => Math.max(0, prev - dosageMmol * 0.9));
      setNotification(`💧 Diluted with H₂O! Ion product Qsp drops, dissolving precipitate.`);
    }

    setTimeout(() => setNotification(null), 3500);
  };

  const handleCheckAnswer = () => {
    if (isTargetAchieved) {
      setShowVictoryModal(true);
    } else {
      if (solutionCondition === "unsaturated") {
        setIncorrectFeedback(
          "The solution is UNSATURATED (Qsp < Ksp). All ions remain fully dissolved. Add a source of Common Ion (NaCl or AgNO₃) to force AgCl to precipitate out!"
        );
      } else if (solutionCondition === "saturated") {
        setIncorrectFeedback(
          "The solution is at exact SATURATED EQUILIBRIUM (Qsp ≈ Ksp). To demonstrate the Common-Ion Effect, add more NaCl or AgNO₃ so Qsp exceeds Ksp and drives precipitation!"
        );
      } else {
        setIncorrectFeedback(
          "Almost there! Add a bit more common ion to produce a clearly visible, distinct precipitate bed before verifying!"
        );
      }
      setShowIncorrectModal(true);
    }
  };

  const handleReset = () => {
    setVolumeMl(100);
    setConcAg(1.0e-5);
    setConcCl(1.0e-5);
    setPrecipitateAmount(0);
    setReagentType("nacl");
    setDosageMmol(0.1);
    setShowVictoryModal(false);
    setShowIncorrectModal(false);
    setNotification("Reset to initial unsaturated solution (100 mL, Qsp = 1.00 × 10⁻¹⁰).");
    setTimeout(() => setNotification(null), 3500);
  };

  // Universal Exit Handler
  const handleExitClick = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  // Helper for formatting numbers in scientific notation (e.g. 1.80 × 10⁻¹⁰)
  const formatSci = (val: number) => {
    const exponent = Math.floor(Math.log10(Math.abs(val)));
    const mantissa = val / Math.pow(10, exponent);
    return `${mantissa.toFixed(2)} × 10${toSuper(exponent)}`;
  };

  const toSuper = (num: number) => {
    const map: Record<string, string> = {
      "-": "⁻",
      "0": "⁰",
      "1": "¹",
      "2": "²",
      "3": "³",
      "4": "⁴",
      "5": "⁵",
      "6": "⁶",
      "7": "⁷",
      "8": "⁸",
      "9": "⁹",
    };
    return String(num)
      .split("")
      .map((ch) => map[ch] || ch)
      .join("");
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
                <span className="text-[#0284C7]">MISSION:</span> Choose a solution to push <span className="font-mono text-sky-800">Qsp</span> above <span className="font-mono text-sky-800">Ksp (1.80 × 10⁻¹⁰)</span> and cause AgCl precipitation!
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
                <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-[11px] sm:text-xs tracking-wider flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                  <span>INSTRUCTIONS TO PLAY</span>
                </div>
                <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
              </div>

              <div className="w-16" />
            </div>

            {/* 3 Step Guidance Cards */}
            <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1 mt-1 sm:mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">

                {/* Card 1: Add Reagents */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Select Reagents
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-2">
                      Select <strong>+ NaCl (Cl⁻)</strong> or <strong>Dilute (H₂O)</strong>, then tap <strong>ADD 0.1 MMOL</strong> to add it to the beaker.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/solubility_step1_reagents.png"
                      alt="Reagent Dock"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 2: Observe 3D Ions & Crystals */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Observe Beaker Reaction
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-2">
                      Watch Ag⁺ and Cl⁻ ions move inside the beaker as solid AgCl crystals form at the bottom!
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/solubility_step2_beaker.png"
                      alt="3D Beaker with Ions and Precipitate"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 3: Check Qsp vs Ksp */}
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
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-2">
                      Track the live Qsp readout as you add solution, then tap <strong>SUBMIT</strong> to check your answer!
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/solubility_step3_hud.png"
                      alt="Digital Ion Product Meter HUD"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 pb-5 flex items-center justify-center gap-3 sm:gap-4 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setScreenState("mission")}
                className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>BACK</span>
              </button>

              <button
                type="button"
                onClick={() => setScreenState("game")}
                className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <Play className="w-3.5 h-3.5 text-sky-200 fill-current" />
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
              <span className="font-mono text-purple-700 font-bold">Drive Qsp &gt; Ksp (Common-Ion Precipitation)</span>
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
          {/* Top-Center Small Live QSP Tab */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="px-3.5 py-1 rounded-full bg-[#0B132B]/90 backdrop-blur-md border border-slate-700/80 shadow-md flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                QSP
              </span>
              <span className="font-mono font-black text-xs sm:text-sm text-amber-400 tracking-tight">
                {formatSci(currentQsp)}
              </span>
            </div>
          </div>

          {/* Notification Banner */}
          {notification && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white font-semibold text-xs py-1 px-4 rounded-full shadow-md border border-slate-700 animate-in fade-in duration-150 max-w-lg text-center pointer-events-none">
              {notification}
            </div>
          )}

          {/* Three.js Canvas: Zoomed out cleanly for portrait & landscape */}
          <Canvas
            className="w-full h-full"
            camera={{ position: [0, 1.0, 13.0], fov: 38 }}
            gl={{ antialias: true, alpha: true }}
            shadows
          >
            <ambientLight intensity={1.15} />
            <directionalLight position={[4, 8, 4]} intensity={1.6} castShadow />
            <directionalLight position={[-4, -3, -3]} intensity={0.6} color="#BAE6FD" />

            <Suspense fallback={null}>
              {/* Center the beaker horizontally and raise it above bottom controls */}
              <group position={[0, 1.45, 0]}>
                <GlassBeaker volume={volumeMl} precipitationAmount={precipitateAmount} />
                <PrecipitateBed amount={precipitateAmount} />
                {ions.map((ion) => (
                  <IonMesh key={ion.id} data={ion} />
                ))}
              </group>
            </Suspense>

            <OrbitControls
              target={[0, 0.95, 0]}
              enablePan={false}
              minDistance={6.0}
              maxDistance={16.5}
              maxPolarAngle={Math.PI / 2 + 0.1}
              minPolarAngle={Math.PI / 4}
            />
          </Canvas>

          {/* Bottom Floating Overlay: Row 1 (Dropdown + ADD 0.1 MMOL) & Row 2 (Long SUBMIT) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-[360px] flex flex-col gap-2 animate-in fade-in duration-200">
            {/* Row 1: Reagent Dropdown + ADD 0.1 MMOL */}
            <div className="w-full grid grid-cols-2 gap-2 items-center">
              {/* Custom Upward Dropdown for NaCl & H2O */}
              <div className="relative w-full">
                {isReagentMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsReagentMenuOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-1.5 z-50 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      {[
                        {
                          id: "nacl" as const,
                          label: "+ NaCl (Cl⁻)",
                          desc: "Increases Qsp • common ion",
                          icon: <PlusCircle className="w-4 h-4 text-violet-600 shrink-0" />,
                          bg: "bg-violet-50",
                        },
                        {
                          id: "water" as const,
                          label: "Dilute (H₂O)",
                          desc: "Decreases Qsp • dilutes ions",
                          icon: <Droplets className="w-4 h-4 text-teal-600 shrink-0" />,
                          bg: "bg-teal-50",
                        },
                      ].map((opt) => {
                        const active = reagentType === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setReagentType(opt.id);
                              setIsReagentMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                              active
                                ? opt.id === "nacl"
                                  ? "bg-violet-50 ring-1 ring-violet-300"
                                  : "bg-teal-50 ring-1 ring-teal-300"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg ${opt.bg} flex items-center justify-center shrink-0`}>
                              {opt.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-slate-900 leading-tight">
                                {opt.label}
                              </div>
                              <div className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                                {opt.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsReagentMenuOpen((o) => !o)}
                  className={`w-full h-12 px-3 rounded-xl border font-extrabold text-xs flex items-center justify-between gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 text-white ${
                    reagentType === "nacl"
                      ? "bg-violet-600 hover:bg-violet-700 border-violet-500 shadow-violet-500/25"
                      : "bg-teal-600 hover:bg-teal-700 border-teal-500 shadow-teal-500/25"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-white/90 shrink-0" />
                    <span className="truncate">
                      {reagentType === "nacl" ? "+ NaCl (Cl⁻)" : "Dilute (H₂O)"}
                    </span>
                  </span>
                  {isReagentMenuOpen ? (
                    <ChevronDown className="w-4 h-4 text-white/80 shrink-0" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-white/80 shrink-0" />
                  )}
                </button>
              </div>

              {/* ADD 0.1 MMOL Button */}
              <button
                type="button"
                onClick={handleAddReagent}
                className="w-full h-12 px-3 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md shadow-sky-500/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Droplets className="w-3.5 h-3.5 fill-white shrink-0" />
                <span>ADD {dosageMmol} MMOL</span>
              </button>
            </div>

            {/* Row 2: Single Long SUBMIT Button */}
            <button
              type="button"
              onClick={handleCheckAnswer}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SUBMIT</span>
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MODAL 1: INCORRECT ANSWER MODAL                                     */}
        {/* ================================================================== */}
        {showIncorrectModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-black text-lg text-slate-900">
                Target Condition Not Reached!
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {incorrectFeedback}
              </p>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncorrectModal(false)}
                  className="flex-1 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  TRY AGAIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowIncorrectModal(false);
                    setShowExplanationModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer"
                >
                  EXPLANATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL 2: VICTORY / SUCCESS MODAL                                    */}
        {/* ================================================================== */}
        {showVictoryModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="font-black text-lg text-slate-900">
                🎉 Challenge Completed!
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Outstanding! By introducing a common ion, you drove the reaction quotient <strong>Qsp</strong> above <strong>Ksp</strong>, forcing insoluble <strong>AgCl</strong> solid crystals to precipitate out!
              </p>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>REPLAY</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExplanationModal(true)}
                  className="flex-1 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer"
                >
                  EXPLANATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL 3: EXPLANATION MODAL (FULL-WIDTH 4-CARD FORMAT)               */}
        {/* ================================================================== */}
        {showExplanationModal && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0284C7]" />
                <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                  Solubility Product (Ksp) &amp; Common-Ion Effect Guide
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

              {/* Section 1: The Basic Story: What is in the beaker? */}
              <div className="space-y-3 border-b border-slate-200/80 pb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
                  <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                    The Basic Story: What is in the beaker?
                  </h3>
                </div>
                <p className="text-slate-700">
                  Imagine you have a glass beaker with water and <strong>Silver Chloride (AgCl)</strong>. <strong>AgCl</strong> is <em>barely soluble</em> in water. That means almost all of it wants to stay as solid white powder/crystals at the bottom, and only a tiny handful dissolves into water as free-floating ions:
                </p>
                <div className="py-2 text-center font-mono font-black text-base sm:text-lg text-sky-900 tracking-wide">
                  AgCl (s) ⇌ Ag⁺ + Cl⁻
                </div>
                <p className="text-slate-700">
                  Water has a strict capacity limit for how many of these ions can float together. This limit is the <strong>Solubility Product (Ksp)</strong>:
                </p>
                <div className="py-2 text-center font-mono font-black text-base sm:text-lg text-sky-900 tracking-wide">
                  Ion Product (Qsp) = [Ag⁺] × [Cl⁻]
                </div>
                <ul className="space-y-2 text-slate-700 list-disc list-inside pl-1 pt-1">
                  <li><strong>If Ion Product = Ksp:</strong> The beaker is <strong>full / saturated</strong> (equilibrium).</li>
                  <li><strong>If Ion Product &gt; Ksp:</strong> The water is <strong>overflowing with ions</strong>, so they combine and drop to the bottom as solid precipitate!</li>
                  <li><strong>If Ion Product &lt; Ksp:</strong> The water has <strong>room for more</strong>, so solid crystals dissolve.</li>
                </ul>
              </div>

              {/* Section 2: What each of the 4 buttons does */}
              <div className="space-y-5 border-b border-slate-200/80 pb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
                  <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                    What each of the 4 buttons does:
                  </h3>
                </div>

                {/* 1. NaCl */}
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-blue-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-blue-900">
                    1. + NaCl (Cl⁻) — Adds Common Chloride Ions
                  </h4>
                  <p className="text-slate-700">
                    <strong>What is it?</strong> Normal table salt (NaCl). Unlike AgCl, normal salt dissolves 100% instantly into Na⁺ and Cl⁻.
                  </p>
                  <p className="text-slate-700">
                    <strong>Why does it matter?</strong> The beaker already has Cl⁻ from the AgCl. Because Cl⁻ is shared (common to both salts), adding NaCl suddenly floods the water with extra Cl⁻.
                  </p>
                  <p className="font-bold text-slate-800">What happens in the beaker?</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                    <li>[Cl⁻] shoots up.</li>
                    <li>The product [Ag⁺] × [Cl⁻] becomes greater than the limit (<strong>Qsp &gt; Ksp</strong>).</li>
                    <li>The excess Cl⁻ grabs floating Ag⁺ ions and forces them to crash out of the water as solid white AgCl crystals at the bottom.</li>
                  </ul>
                  <p className="text-slate-900 font-semibold pt-1">
                    👉 <strong>Result:</strong> Adding table salt actually makes the silver salt less soluble and fall out as solid! That is the <strong>Common Ion Effect</strong>.
                  </p>
                </div>

                {/* 2. AgNO3 */}
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-indigo-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-indigo-900">
                    2. + AgNO₃ (Ag⁺) — Adds Common Silver Ions
                  </h4>
                  <p className="text-slate-700">
                    <strong>What is it?</strong> Silver Nitrate (AgNO₃). It is a very soluble salt that dissolves 100% into Ag⁺ and NO₃⁻.
                  </p>
                  <p className="text-slate-700">
                    <strong>Why does it matter?</strong> This time, we are adding extra Ag⁺, which is the other common ion.
                  </p>
                  <p className="font-bold text-slate-800">What happens in the beaker?</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                    <li>[Ag⁺] shoots up.</li>
                    <li>The product [Ag⁺] × [Cl⁻] again exceeds the limit (<strong>Qsp &gt; Ksp</strong>).</li>
                    <li>The excess Ag⁺ grabs floating Cl⁻ and precipitates out as solid AgCl.</li>
                  </ul>
                  <p className="text-slate-900 font-semibold pt-1">
                    👉 <strong>Result:</strong> Just like NaCl, adding silver nitrate forces solid AgCl to precipitate out.
                  </p>
                </div>

                {/* 3. AgCl Salt */}
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-slate-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    3. + AgCl Salt — Adds Pure Solid Salt
                  </h4>
                  <p className="text-slate-700">
                    <strong>What is it?</strong> You are scooping raw solid AgCl powder straight into the beaker.
                  </p>
                  <p className="font-bold text-slate-800">What happens in the beaker?</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                    <li>If the water is already saturated (full), it cannot dissolve any more AgCl.</li>
                    <li>So this added powder just falls directly to the bottom and sits there as more solid crystals.</li>
                    <li>It does not change the dissolved ion concentration because the water is already at its saturation limit.</li>
                  </ul>
                </div>

                {/* 4. Dilute */}
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-sky-400">
                  <h4 className="font-extrabold text-sm sm:text-base text-sky-900">
                    4. Dilute (H₂O) — Adds Pure Water
                  </h4>
                  <p className="text-slate-700">
                    <strong>What is it?</strong> Pouring clean water into the beaker (increasing volume from 100 mL up to 200 mL).
                  </p>
                  <p className="font-bold text-slate-800">What happens in the beaker?</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                    <li>More water gives the ions more room to spread out, so the concentrations [Ag⁺] and [Cl⁻] both drop (become diluted).</li>
                    <li>Now, the ion product drops below the limit (<strong>Qsp &lt; Ksp</strong>) — the solution becomes unsaturated.</li>
                    <li>Because the water now has room for more ions, the solid crystals on the bottom begin to dissolve back into floating ions until equilibrium is restored!</li>
                  </ul>
                </div>
              </div>

              {/* Section 3: Quick Summary Table */}
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
                        <th className="py-2.5 pr-4">Action Button</th>
                        <th className="py-2.5 px-4">What You&apos;re Adding</th>
                        <th className="py-2.5 px-4">What Happens to Ions</th>
                        <th className="py-2.5 pl-4">Result in the Beaker</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="py-3 pr-4 font-bold text-blue-700 font-mono text-xs sm:text-sm">+ NaCl</td>
                        <td className="py-3 px-4">Extra Cl⁻ (common ion)</td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">[Cl⁻] ↑ ➔ Qsp &gt; Ksp</td>
                        <td className="py-3 pl-4">🌧️ <strong>Precipitation:</strong> Solid AgCl falls to the bottom.</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-indigo-700 font-mono text-xs sm:text-sm">+ AgNO₃</td>
                        <td className="py-3 px-4">Extra Ag⁺ (common ion)</td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">[Ag⁺] ↑ ➔ Qsp &gt; Ksp</td>
                        <td className="py-3 pl-4">🌧️ <strong>Precipitation:</strong> Solid AgCl falls to the bottom.</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-slate-800 font-mono text-xs sm:text-sm">+ AgCl Salt</td>
                        <td className="py-3 px-4">Insoluble solid powder</td>
                        <td className="py-3 px-4 font-mono text-slate-600">Stays at equilibrium limit</td>
                        <td className="py-3 pl-4">📦 Solid just piles up at the bottom without dissolving.</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-sky-700 font-mono text-xs sm:text-sm">Dilute (H₂O)</td>
                        <td className="py-3 px-4">Pure water</td>
                        <td className="py-3 px-4 font-mono font-bold text-sky-700">[Ag⁺] &amp; [Cl⁻] ↓ ➔ Qsp &lt; Ksp</td>
                        <td className="py-3 pl-4">☀️ <strong>Dissolution:</strong> Solid crystals dissolve back into the water.</td>
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

export default SolubilityProductGamePage;

